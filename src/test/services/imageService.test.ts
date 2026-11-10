
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    currentUser: null as unknown,
}));

vi.mock("../../services/firebase", () => ({
    auth: mocks,
}));

import { uploadProductImage } from "../../services/imageService";

const GENERIC_ERROR = "No pudimos subir la imagen. Intentá de nuevo.";

function makeFile() {
    return new File(["imagen de prueba"], "libro.jpg", {
        type: "image/jpeg",
    });
}

function mockResponse(
    body: unknown,
    status = 200,
    ok = status >= 200 && status < 300,
) {
    return {
        ok,
        status,
        json: vi.fn().mockResolvedValue(body),
    };
}

function setCurrentUser() {
    mocks.currentUser = {
        getIdToken: vi.fn().mockResolvedValue("token-de-prueba"),
    };
}

beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
    mocks.currentUser = null;
});

describe("uploadProductImage", () => {
    it("rechaza la subida si no hay usuario autenticado", async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        await expect(uploadProductImage(makeFile())).rejects.toThrow(
            "Tenés que iniciar sesión para subir imágenes.",
        );

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("solicita una URL prefirmada y sube la imagen a S3", async () => {
        setCurrentUser();

        const fetchMock = vi.fn()
            .mockResolvedValueOnce(
                mockResponse({
                    uploadUrl: "https://s3.example.com/upload",
                    publicUrl: "https://s3.example.com/libro.jpg",
                }),
            )
            .mockResolvedValueOnce(mockResponse(null));

        vi.stubGlobal("fetch", fetchMock);

        const file = makeFile();
        const result = await uploadProductImage(file);

        expect(fetchMock).toHaveBeenCalledTimes(2);

        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            "/api/upload-url",
            expect.objectContaining({
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer token-de-prueba",
                },
                body: JSON.stringify({ contentType: "image/jpeg" }),
            }),
        );

        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            "https://s3.example.com/upload",
            {
                method: "PUT",
                headers: { "Content-Type": "image/jpeg" },
                body: file,
            },
        );

        expect(result).toBe("https://s3.example.com/libro.jpg");
    });

    it("devuelve un error si falla la solicitud de la URL prefirmada", async () => {
        setCurrentUser();

        vi.stubGlobal(
            "fetch",
            vi.fn().mockRejectedValue(new Error("Error de red")),
        );

        await expect(uploadProductImage(makeFile())).rejects.toThrow(
            GENERIC_ERROR,
        );
    });

    it.each([
        [401, "Tu sesión venció. Volvé a iniciar sesión."],
        [403, "Solo los administradores pueden subir imágenes."],
        [400, "Tipo de archivo no permitido. Usá JPG, PNG o WebP."],
        [500, GENERIC_ERROR],
    ])("maneja el error HTTP %i", async (status, message) => {
        setCurrentUser();

        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(mockResponse(null, status, false)),
        );

        await expect(uploadProductImage(makeFile())).rejects.toThrow(message);
    });

    it("maneja una respuesta JSON inválida", async () => {
        setCurrentUser();

        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: vi.fn().mockRejectedValue(new Error("JSON inválido")),
            }),
        );

        await expect(uploadProductImage(makeFile())).rejects.toThrow(
            GENERIC_ERROR,
        );
    });

    it("rechaza una respuesta sin las URLs necesarias", async () => {
        setCurrentUser();

        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                mockResponse({ uploadUrl: "https://s3.example.com/upload" }),
            ),
        );

        await expect(uploadProductImage(makeFile())).rejects.toThrow(
            GENERIC_ERROR,
        );
    });

    it("maneja un error de red durante la subida a S3", async () => {
        setCurrentUser();

        vi.stubGlobal(
            "fetch",
            vi.fn()
                .mockResolvedValueOnce(
                    mockResponse({
                        uploadUrl: "https://s3.example.com/upload",
                        publicUrl: "https://s3.example.com/libro.jpg",
                    }),
                )
                .mockRejectedValueOnce(new Error("Error de red")),
        );

        await expect(uploadProductImage(makeFile())).rejects.toThrow(
            GENERIC_ERROR,
        );
    });

    it("maneja una respuesta HTTP fallida de S3", async () => {
        setCurrentUser();

        vi.stubGlobal(
            "fetch",
            vi.fn()
                .mockResolvedValueOnce(
                    mockResponse({
                        uploadUrl: "https://s3.example.com/upload",
                        publicUrl: "https://s3.example.com/libro.jpg",
                    }),
                )
                .mockResolvedValueOnce(mockResponse(null, 500, false)),
        );

        await expect(uploadProductImage(makeFile())).rejects.toThrow(
            GENERIC_ERROR,
        );
    });
});
