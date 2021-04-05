import React from "react";
import { Route, Switch } from "react-router-dom";
import "./App.css";
import NavigationBar from "./Components/NavigationBar";
import Error from "./Pages/Error";
import Records from "./Pages/Records";
import Replay from "./Pages/Replay";

function App() {
  return (
    <div className="App">
      <NavigationBar />
      <Switch>
        <Route path="/" component={Records} exact />
        <Route path="/replay/:replayId" component={Replay} exact />
        <Route component={Error} />
      </Switch>
    </div>
  );
}

export default App;
