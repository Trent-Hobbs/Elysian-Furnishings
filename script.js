function handleLogin() {
    // Get values from the input fields
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const message = document.getElementById('message');
  
    // Check if username and password are correct (example only)
    if (username === 'user' && password === 'pass123') {
      message.style.color = 'green';
      message.textContent = 'Login successful!';
    } else {
      message.style.color = 'red';
      message.textContent = 'Invalid username or password.';
    }
  
    // Prevent form submission (for demonstration purposes)
    return false;
  }
  