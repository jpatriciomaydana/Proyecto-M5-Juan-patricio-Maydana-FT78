import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
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
                ? { uid: firebaseUser.uid, email: firebaseUser.email }
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