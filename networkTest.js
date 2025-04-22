/**
 * Network connectivity test utility
 */

// Function to check if the device can connect to Firebase servers
export const testFirebaseConnectivity = async () => {
  try {
    // Test connectivity to Firebase Auth endpoint
    const authResponse = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyDTv4PwJ967bdcNgGpIWgY0olNMWktt7yY', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // This is just a connectivity test, not a real sign-up
        email: 'test@example.com',
        password: 'password',
        returnSecureToken: false,
      }),
    });
    
    // We expect an error response, but at least we know we can connect
    const authData = await authResponse.json();
    
    // Try to connect to Firestore endpoint
    const firestoreResponse = await fetch('https://firestore.googleapis.com/v1/projects/unifit-mdb/databases/(default)/documents');
    
    return {
      success: true,
      auth: {
        reachable: true,
        statusCode: authResponse.status,
        response: authData
      },
      firestore: {
        reachable: true,
        statusCode: firestoreResponse.status
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}; 