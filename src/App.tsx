import React from "react";
import { Route, Switch } from "react-router-dom";
import "./App.css";
import NavigationBar from "./Components/NavigationBar";
import Error from "./Pages/Error";
import Records from "./Pages/Records";

function App() {
  return (
    <div className="App">
      <NavigationBar />
      <Switch>
        <Route path="/" component={Records} exact />
        <Route component={Error} />
      </Switch>
    </div>
  );
}

export default App;
