import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";

// Log the “app” container so we know it’s found
const container = document.getElementById("app");
console.log("CONTAINER LOGGED:", container);

// Use React 17’s render API
ReactDOM.render(
  <App />,
  container
);
