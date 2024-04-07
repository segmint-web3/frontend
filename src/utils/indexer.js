
export async function getState(collectionAddress, fromLt) {

  return fetch(`https://test.segmint.app/${collectionAddress}.json?cache=${fromLt}`, {})
    .then(response => {
      if (!response.ok) {
        throw new Error('Network error');
      }
      return response.json();
    })
}

