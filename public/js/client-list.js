async function deleteClient(id) {
  try {
    const response = await fetch(
      "https://mongodb-express-app.onrender.com/api/clients/" + id,
      {
        method: "DELETE",
      }
    );
    if (response.ok) {
      console.log(`Deleted client with ID ${id}`);
    }
  } catch (error) {
    console.error(error);
  }

  fetchClients();
}

async function fetchClients() {
  try {
    const response = await fetch(
      "https://mongodb-express-app.onrender.com/api/clients"
    );
    if (response.ok) {
      const data = await response.json();
      displayClients(data);
    }
  } catch (error) {
    throw error;
  }
}

function displayClients(clients) {
  const container = document.querySelector("#client-list-container");
  const ul = document.createElement("ul");

  container.textContent = "";
  container.appendChild(ul);

  clients.forEach((client) => {
    const li = document.createElement("li");
    const deleteButton = document.createElement("button");

    li.textContent = `${client.firstName} ${client.lastName}, ${client.email}`;
    deleteButton.textContent = "delete";
    deleteButton.addEventListener("click", () => {
      deleteClient(client._id);
    });

    li.appendChild(deleteButton);
    ul.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fetchClients();
});
