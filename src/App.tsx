import React from "react";
import { Route, Switch } from "react-router-dom";
import "./App.css";
import NavigationBar from "./Components/NavigationBar";
import Error from "./Pages/Error";
import Replay from "./Pages/Replay";

function App() {
  return (
    <div className="App">
      <NavigationBar />
      <Switch>
        <Route path="/" component={Replay} exact />
        <Route component={Error} />
      </Switch>
    </div>
  );
}

export default App;
