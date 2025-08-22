


function openDatabase() {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("FileDatabase", 1);

        request.onupgradeneeded = (event) => {
            const db = request.result;
            if (!db.objectStoreNames.contains("files")) {
                db.createObjectStore("files", { keyPath: "id" });
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject("Error opening database");
        };
    });
}

export async function storeFile(file: File) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("files", "readwrite");
        const store = transaction.objectStore("files");

        const fileRecord = {
            id: file.name,  // Use the file's name as the ID
            data: file      // Store the file directly
        };

        const request = store.put(fileRecord);

        request.onsuccess = () => {
            resolve("File stored successfully!");
        };

        request.onerror = () => {
            reject("Error storing file");
        };
    });
}



async function getFile(fileId) {
    const db = await openDatabase();

    return new Promise<File>((resolve, reject) => {
        const transaction = db.transaction("files", "readonly");
        const store = transaction.objectStore("files");

        const request = store.get(fileId);

        request.onsuccess = (event) => {
            if (request.result) {
                debugger
                resolve(request.result.data);
            } else {
                reject("File not found");
            }
        };

        request.onerror = () => {
            reject("Error retrieving file");
        };
    });
}





export async function getFiles() {
    const db = await openDatabase();
    return new Promise<Array<File>>((resolve, reject) => {
        const transaction = db.transaction("files", "readonly");
        const store = transaction.objectStore("files");

        const files: File[] = [];
        const request = store.openCursor();

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                const fileRecord = cursor.value;
                files.push(fileRecord.data);
                cursor.continue();
            } else {
                resolve(files);
            }
        };

        request.onerror = () => {
            reject(new Error("Error retrieving files"));
        };
    });
}