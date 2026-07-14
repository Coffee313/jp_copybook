(function () {
  const dialog = document.querySelector('#donationDialog');
  const openButton = document.querySelector('#openDonation');
  const closeButton = document.querySelector('#closeDonation');
  if (!dialog || !openButton || !closeButton) return;

  openButton.addEventListener('click', () => {
    dialog.showModal();
    requestAnimationFrame(() => closeButton.focus());
  });
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    dialog.close();
  });
})();
