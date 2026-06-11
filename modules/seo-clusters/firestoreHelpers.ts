import { db } from "../../server/firebaseAdmin";

export const firestoreHelpers = {
  getCollection: (name: string) => db.collection(name),
  doc: (collection: string, id: string) => db.collection(collection).doc(id),
};
