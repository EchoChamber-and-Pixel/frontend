import React from "react";
import { Nav, Navbar, NavbarBrand, NavItem } from "reactstrap";
import { ExternalNavbarLink } from "../StyledComponents/ExternalNavbarLink";

/**
 * Render component for the navigation bar.
 */
function NavigationBar() {
  return (
    <Navbar style={{ backgroundColor: "#7c5aa4" }} dark expand="md">
      <NavbarBrand href="/">
        EchoChamber x Pixel{" "}
        <span role="img" aria-label="woman running">
          🏃‍♀️
        </span>
      </NavbarBrand>
      <Nav className="mr-auto" navbar>
        <NavItem>
          <ExternalNavbarLink href="https://github.com/EchoChamber-and-Pixel">
            GitHub Source{" "}
            <span role="img" aria-label="hacker cat">
              🐱‍💻
            </span>
          </ExternalNavbarLink>
        </NavItem>
      </Nav>
      <span role="img" aria-label="heart">
        💜
      </span>
    </Navbar>
  );
}

export default NavigationBar;
