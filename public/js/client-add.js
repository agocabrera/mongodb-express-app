document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#new-user-form");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const jsonData = JSON.stringify(Object.fromEntries(formData));

    try {
      fetch("http://localhost:3000/api/clients/", {
        method: "POST",
        body: jsonData,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error(error);
    }

    form.reset();
  });
});
