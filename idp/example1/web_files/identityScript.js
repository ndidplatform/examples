function createNewIdentity() {
  let namespace = document.getElementById('namespace').value;
  let identifier = document.getElementById('identifier').value;
  fetch('/identity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      namespace,
      identifier,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw response;
      }
      return response.text();
    })
    .then((text) => {
      if (parseInt(text) !== 0) {
        alert('Identity created');
        window.location = '/home/' + namespace + '/' + identifier;
      } else {
        alert('Cannot create identity');
      }
    })
    .catch((error) => {
      console.error(error);
      alert('Cannot create identity');
    });
}
window.onload = function() {
  document
    .getElementById('createNewIdentity')
    .addEventListener('click', createNewIdentity);
};
