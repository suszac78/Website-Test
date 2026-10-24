/* Saves products made in the Studio inside this browser (IndexedDB).
   Images are stored as data URLs so they show up on every page of the shop.
   Note: these live in this browser only. To publish for everyone, add them to js/products.js. */
window.HD = window.HD || {};

(function () {
  const DB = "hd-studio", STORE = "products";
  let dbPromise;

  function open() {
    if (!("indexedDB" in window)) return Promise.reject(new Error("no-idb"));
    dbPromise = dbPromise || new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function run(mode, fn) {
    return open().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const result = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(result && "result" in result ? result.result : undefined);
      tx.onerror = () => reject(tx.error);
    }));
  }

  HD.store = {
    all: () => run("readonly", (s) => s.getAll()).then((list) => (list || []).sort((a, b) => b.created - a.created)).catch(() => []),
    get: (id) => run("readonly", (s) => s.get(id)).catch(() => undefined),
    put: (product) => run("readwrite", (s) => s.put(product)),
    remove: (id) => run("readwrite", (s) => s.delete(id)),
  };

  /* Built-in catalog + Studio products (Studio ones first, marked as "Yours") */
  HD.allProducts = async function () {
    const mine = await HD.store.all();
    return [...mine.map((p) => ({ ...p, mine: true })), ...HD.products];
  };

  HD.findProduct = async function (id) {
    return HD.products.find((p) => p.id === id) || (await HD.store.get(id));
  };
})();
