import { saveOptionsFromForm, loadOptionsToForm } from "../chrome/storage.mjs";

const options = document.querySelector("#options");
options.addEventListener("submit", (event) => {
  event.preventDefault();

  saveOptionsFromForm(event.target);
});
loadOptionsToForm(options);
