"use strict";

const authConfig = Object.freeze({
  domain: "https://ap-southeast-4arsozcgx7.auth.ap-southeast-4.amazoncognito.com",
  clientId: "159rdt49r5m58neqjuu33dpcpu",
  redirectUri: "https://d1khr8jeayvsgv.cloudfront.net/",
  signOutUri: "https://d1khr8jeayvsgv.cloudfront.net/",
  scopes: "openid email securehome-api/orders.write"
});

const signInButton = document.querySelector("#sign-in-button");
const signOutButton = document.querySelector("#sign-out-button");
const myOrdersButton = document.querySelector("#my-orders-button");
const authStatus = document.querySelector("#auth-status");

const storageKeys = Object.freeze({
  verifier: "securehome-pkce-verifier",
  state: "securehome-oauth-state",
  nonce: "securehome-oauth-nonce",
  session: "securehome-auth-session"
});



function getAccessToken() {
  try {
    const session = JSON.parse(
      sessionStorage.getItem("securehome-auth-session") || "{}"
    );

    return session.accessToken || null;
  } catch (error) {
    console.error("Unable to read authentication session:", error);
    return null;
  }
}

function base64UrlEncode(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function createRandomValue() {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
}

async function createCodeChallenge(verifier) {
  const encodedVerifier = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", encodedVerifier);
  return base64UrlEncode(digest);
}

function decodeIdToken(idToken) {
  const encodedPayload = idToken.split(".")[1];

  if (!encodedPayload) {
    throw new Error("The ID token is not valid.");
  }

  const base64 = encodedPayload
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(encodedPayload.length / 4) * 4, "=");

  const bytes = Uint8Array.from(atob(base64), (character) =>
    character.charCodeAt(0)
  );

  return JSON.parse(new TextDecoder().decode(bytes));
}

function clearTemporaryAuthData() {
  sessionStorage.removeItem(storageKeys.verifier);
  sessionStorage.removeItem(storageKeys.state);
  sessionStorage.removeItem(storageKeys.nonce);
}

function clearCallbackParameters() {
  const cleanUrl = `${window.location.pathname}${window.location.hash}`;
  window.history.replaceState({}, document.title, cleanUrl);
}

function showSignedOut(message = "Not signed in") {
  authStatus.textContent = message;
  signInButton.hidden = false;
  signOutButton.hidden = true;
  myOrdersButton.hidden = true;
}

function showSignedIn(idToken) {
  const claims = decodeIdToken(idToken);
  authStatus.textContent = claims.email
    ? `Signed in: ${claims.email}`
    : "Signed in";
  signInButton.hidden = true;
  signOutButton.hidden = false;
  myOrdersButton.hidden = false;
}

async function startSignIn() {
  const verifier = createRandomValue();
  const state = createRandomValue();
  const nonce = createRandomValue();
  const challenge = await createCodeChallenge(verifier);

  sessionStorage.setItem(storageKeys.verifier, verifier);
  sessionStorage.setItem(storageKeys.state, state);
  sessionStorage.setItem(storageKeys.nonce, nonce);

  const authorizeUrl = new URL(`${authConfig.domain}/oauth2/authorize`);
  authorizeUrl.search = new URLSearchParams({
    response_type: "code",
    client_id: authConfig.clientId,
    redirect_uri: authConfig.redirectUri,
    scope: authConfig.scopes,
    state,
    nonce,
    code_challenge_method: "S256",
    code_challenge: challenge
  }).toString();

  window.location.assign(authorizeUrl.toString());
}

async function exchangeAuthorizationCode(code) {
  const verifier = sessionStorage.getItem(storageKeys.verifier);

  if (!verifier) {
    throw new Error("The secure sign-in verifier is missing. Please sign in again.");
  }

  const response = await fetch(`${authConfig.domain}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: authConfig.clientId,
      code,
      redirect_uri: authConfig.redirectUri,
      code_verifier: verifier
    })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error_description || "Cognito could not complete sign-in.");
  }

  return result;
}

async function handleAuthorizationCallback() {
  const parameters = new URLSearchParams(window.location.search);
  const authorizationCode = parameters.get("code");
  const returnedState = parameters.get("state");
  const oauthError = parameters.get("error_description") || parameters.get("error");

  if (oauthError) {
    clearTemporaryAuthData();
    clearCallbackParameters();
    throw new Error(oauthError);
  }

  if (!authorizationCode) {
    return false;
  }

  const expectedState = sessionStorage.getItem(storageKeys.state);

  if (!expectedState || returnedState !== expectedState) {
    clearTemporaryAuthData();
    clearCallbackParameters();
    throw new Error("The sign-in security check failed. Please sign in again.");
  }

  const tokens = await exchangeAuthorizationCode(authorizationCode);
  const claims = decodeIdToken(tokens.id_token);
  const expectedNonce = sessionStorage.getItem(storageKeys.nonce);

  if (!expectedNonce || claims.nonce !== expectedNonce) {
    clearTemporaryAuthData();
    clearCallbackParameters();
    throw new Error("The sign-in token security check failed.");
  }

  sessionStorage.setItem(
    storageKeys.session,
    JSON.stringify({
      idToken: tokens.id_token,
      accessToken: tokens.access_token
    })
  );

  clearTemporaryAuthData();
  clearCallbackParameters();
  showSignedIn(tokens.id_token);
  return true;
}

function restoreSession() {
  const savedSession = sessionStorage.getItem(storageKeys.session);

  if (!savedSession) {
    showSignedOut();
    return;
  }

  try {
    const session = JSON.parse(savedSession);
    const claims = decodeIdToken(session.idToken);
    const currentTime = Math.floor(Date.now() / 1000);

    if (!claims.exp || claims.exp <= currentTime) {
      sessionStorage.removeItem(storageKeys.session);
      showSignedOut("Session expired");
      return;
    }

    showSignedIn(session.idToken);
  } catch (error) {
    console.warn("The saved sign-in session could not be loaded.", error);
    sessionStorage.removeItem(storageKeys.session);
    showSignedOut();
  }
}

function signOut() {
  sessionStorage.removeItem(storageKeys.session);
  clearTemporaryAuthData();

  const logoutUrl = new URL(`${authConfig.domain}/logout`);
  logoutUrl.search = new URLSearchParams({
    client_id: authConfig.clientId,
    logout_uri: authConfig.signOutUri
  }).toString();

  window.location.assign(logoutUrl.toString());
}

signInButton.addEventListener("click", () => {
  startSignIn().catch((error) => {
    console.error("Sign-in could not start.", error);
    showSignedOut("Sign-in could not start");
  });
});

signOutButton.addEventListener("click", signOut);

handleAuthorizationCallback()
  .then((handledCallback) => {
    if (!handledCallback) {
      restoreSession();
    }
  })
  .catch((error) => {
    console.error("Authentication error:", error);
    sessionStorage.removeItem(storageKeys.session);
    showSignedOut(error.message);
  });
