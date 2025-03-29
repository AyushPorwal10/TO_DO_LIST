// Get the theme toggle button
const themeToggleButton = document.getElementById('theme-toggle');

// Add an event listener to toggle the theme
themeToggleButton.addEventListener('click', () => {
    // Toggle the 'dark-mode' class on the body
    document.body.classList.toggle('dark-mode');

    // Update the button text based on the mode
    if (document.body.classList.contains('dark-mode')) {
        themeToggleButton.textContent = 'Switch to Light Mode';
    } else {
        themeToggleButton.textContent = 'Switch to Dark Mode';
    }
});
