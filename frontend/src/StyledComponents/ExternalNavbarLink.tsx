import styled from "styled-components";

const ExternalNavbarLink = styled.a`
  display: block;
  padding: 12px;
  color: #fff;
  height: 100%;
  transition: background 0.1s;

  &:hover {
    color: #fff;
    background: #6f5193;
    text-decoration: none;
  }
`;

export { ExternalNavbarLink };
