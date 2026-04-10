export async function getTasks() {
  const response = await fetch("http://localhost:8080/api/tasks");

  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }

  return response.json();
}