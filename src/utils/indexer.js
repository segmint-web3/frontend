
export async function getState(collectionAddress, fromLt) {
  const controller = new AbortController();
  const signal = controller.signal;

  const promise = fetch(`/${collectionAddress}.json?cache=${fromLt}`, { signal })
    .then(response => {
      if (!response.ok) {
        throw new Error('Ошибка сети');
      }
      return response.json();
    })

  setTimeout(() => {
    controller.abort();
  }, 60000);

  return promise;
}

