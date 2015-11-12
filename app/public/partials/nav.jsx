import React from 'react';
import { Link } from 'react-router';
import {FormattedMessage} from 'react-intl';

class Nav extends React.Component {

  render() {
    return (
      <nav>
        <ul>
          <li>
            <a href='#explore'>
              <h5>
                <FormattedMessage
                  id='Explore'
                  defaultMessage='Explore'
                />
              </h5>
              <div><span>See what's happening in<br/>parks near you</span></div>
            </a>
          </li>
          <li>
            <a href='#discover'>
              <h5>
                <FormattedMessage
                  id='Discover'
                  defaultMessage='Discover'
                />
              </h5>
              <div><span>Learn more about parks<br/>across the state</span></div>
            </a>
          </li>
          <li>
            <Link to='/wander'>
              <h5>
                <FormattedMessage
                  id='Wander'
                  defaultMessage='Wander'
                />
              </h5>
              <div><span>Find out more about one<br/>of our featured parks</span></div>
            </Link>
          </li>
        </ul>
      </nav>
    );
  }

}

export default Nav;