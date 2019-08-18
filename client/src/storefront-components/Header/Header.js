import React, { Component } from "react";
import { connect } from "react-redux";

import { showLogin, showRegister, logout } from "../../redux/user/user-actions";
import { showSideNav } from "../../redux/ui/ui-actions";

import MainNav from "./MainNav/MainNav";
import AccountNav from "./AccountNav/AccountNav";
import SearchBox from "./SearchBox/SearchBox";
import Brand from "./Brand/Brand";

import styles from "./Header.module.css";

class Header extends Component {
  render() {
    return (
      <React.Fragment>
        <div className={styles.Header}>
          <div className={styles.HeaderRow}>
            <Brand settings={this.props.settings} />
            <AccountNav
              loadingUser={this.props.loadingUser}
              user={this.props.user}
              logout={this.props.logout}
              showLogin={this.props.showLogin}
              showRegister={this.props.showRegister}
              cartSize={this.props.cartSize}
            />
          </div>
          <div className={styles.HeaderRow}>
            <MainNav
              categories={this.props.categories}
              onHamburgerClick={this.props.onHamburgerClick}
            />
            <SearchBox />
          </div>
        </div>
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({ cart, settings, categories, user }) => ({
  cartSize: cart.cartSize,
  settings,
  categories: categories.categories,
  user: user.user,
  loadingUser: user.loadingUser
});

const mapDispatchToProps = dispatch => ({
  showLogin: () => dispatch(showLogin()),
  showRegister: () => dispatch(showRegister()),
  logout: () => dispatch(logout()),
  onHamburgerClick: () => dispatch(showSideNav())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Header);
