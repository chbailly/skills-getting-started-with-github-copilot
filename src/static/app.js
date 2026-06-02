document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Render participants as a stylized list with delete buttons; show placeholder when empty
        const participantsHTML = details.participants && details.participants.length
          ? details.participants.map(p => {
              const initial = (p && p[0]) ? p[0].toUpperCase() : "?";
              return `<li class="participant-item" data-activity="${encodeURIComponent(name)}" data-email="${p}">
                        <span class="participant-info">
                          <span class="participant-avatar">${initial}</span>
                          <span class="participant-email">${p}</span>
                        </span>
                        <button class="delete-btn" title="Unregister">✖</button>
                      </li>`;
            }).join("")
          : `<li class="participant-empty">No participants yet</li>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants</h5>
            <ul class="participants-list">
              ${participantsHTML}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Attach click handler for delete buttons via event delegation on the activity card
        activityCard.addEventListener('click', async (ev) => {
          const btn = ev.target.closest('.delete-btn');
          if (!btn) return;

          const li = btn.closest('li');
          if (!li) return;

          const activityName = decodeURIComponent(li.getAttribute('data-activity'));
          const email = li.getAttribute('data-email');

          if (!activityName || !email) return;

          if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

          try {
            const res = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
            const result = await res.json();
            if (res.ok) {
              messageDiv.textContent = result.message || 'Unregistered successfully';
              messageDiv.className = 'success';
              messageDiv.classList.remove('hidden');
              // Refresh the list
              fetchActivities();
            } else {
              messageDiv.textContent = result.detail || 'Failed to unregister';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
            }
            setTimeout(() => messageDiv.classList.add('hidden'), 5000);
          } catch (err) {
            console.error('Error unregistering:', err);
            messageDiv.textContent = 'Failed to unregister. Please try again.';
            messageDiv.className = 'error';
            messageDiv.classList.remove('hidden');
            setTimeout(() => messageDiv.classList.add('hidden'), 5000);
          }
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
