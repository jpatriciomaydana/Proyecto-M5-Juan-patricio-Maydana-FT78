import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
} from "firebase/auth";
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
    Timestamp,
} from "firebase/firestore";

import { auth, db } from "./firebase";
import type { AuthUser, UserProfile } from "../types/user";

// Escucha los cambios de sesión y entrega un AuthUser propio (o null).
// Devuelve la función para cancelar la suscripción.
export function subscribeToAuthChanges(
    callback: (user: AuthUser | null) => void | Promise<void>,
): () => void {
    return onAuthStateChanged(auth, (firebaseUser) => {
        void callback(
            firebaseUser
                ? {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                }
                : null,
        );
    });
}

// Devuelve el uid del usuario recién creado.
export async function registerUser(
    email: string,
    password: string,
): Promise<string> {
    const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
    );

    await setDoc(doc(db, "users", credential.user.uid), {
        email: credential.user.email,
        role: "customer",
        createdAt: serverTimestamp(),
    });

    return credential.user.uid;
}

export async function loginUser(
    email: string,
    password: string,
): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
}

// Abre la ventana de Google. Si es la primera vez que la persona entra,
// crea su users/{uid} con rol customer. Si el documento ya existe
// (por ejemplo, un admin) no se toca, para no pisar el rol.
// Devuelve el uid.
export async function loginWithGoogle(): Promise<string> {
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
    const uid = credential.user.uid;

    const existingProfile = await getUserProfile(uid);

    if (!existingProfile) {
        await setDoc(doc(db, "users", uid), {
            email: credential.user.email,
            role: "customer",
            createdAt: serverTimestamp(),
        });
    }

    return uid;
}

export async function logoutUser(): Promise<void> {
    await signOut(auth);
}

export async function getUserProfile(
    uid: string,
): Promise<UserProfile | null> {
    const snapshot = await getDoc(doc(db, "users", uid));

    if (!snapshot.exists()) {
        return null;
    }

    const data = snapshot.data();

    return {
        uid: snapshot.id,
        email: data.email,
        displayName: data.displayName ?? "",
        role: data.role === "admin" ? "admin" : "customer",
        createdAt:
            data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : new Date(),
    };
}