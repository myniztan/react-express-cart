import "es6-promise/auto";
import "es6-object-assign/auto";

import React, { Component, lazy, Suspense } from "react";
import { Route, Switch } from "react-router-dom";
import api from "./api";
import scriptLoader from "react-async-script";
import { HelmetProvider } from "react-helmet-async";

import Header from "./storefront-components/Header/Header";
import Footer from "./storefront-components/Footer/Footer";
import Category from "./storefront-components/Category/Category";
import Products from "./storefront-components/Products/Products";
import Login from "./shared-components/Login/Login";
import Home from "./storefront-components/Home/Home";
import SideNav from "./storefront-components/SideNav/SideNav";
import Modal from "./storefront-components/Modal/Modal";
import CartAdded from "./storefront-components/CartAdded/CartAdded";
import Spinner from "./shared-components/Spinner/Spinner";

import styles from "./Storefront.module.css";

const Checkout = lazy(() =>
  import("./storefront-components/Checkout/Checkout")
);
const Cart = lazy(() => import("./storefront-components/Cart/Cart"));
const Product = lazy(() => import("./storefront-components/Product/Product"));
const Addresses = lazy(() =>
  import("./storefront-components/Addresses/Addresses")
);
const Orders = lazy(() => import("./storefront-components/Orders/Orders"));
const Order = lazy(() => import("./storefront-components/Order/Order"));
const Page = lazy(() => import("./storefront-components/Page/Page"));
const Success = lazy(() =>
  import("./storefront-components/Checkout/Success/Success")
);
const Profile = lazy(() => import("./storefront-components/Profile/Profile"));

const CheckoutWithScript = scriptLoader("https://js.stripe.com/v3/")(Checkout);

class Storefront extends Component {
  state = {
    showLogin: false,
    showSideNav: false,
    isRegister: false,
    categories: [],
    cart: [],
    cartID: "",
    loggedIn: false,
    user: {},
    loadingUser: true,
    loadingCart: true,
    loadingCategories: true,
    scriptLoaded: false,
    showCartAdded: false,
    cartItemAdded: null,
    settings: {}
  };

  cancelTokens = {};

  componentDidMount() {
    const token = window.localStorage.getItem("session");
    const cartID = window.localStorage.getItem("cartSession");

    this.cancelTokens.getCatsRequest = api.getCancelTokenSource();
    this.cancelTokens.getSettingsRequest = api.getCancelTokenSource();

    Promise.all([
      api.get(
        "/api/categories",
        { cancelToken: this.cancelTokens.getCatsRequest.token },
        false,
        false
      ),
      api.get(
        "/api/settings/general",
        { cancelToken: this.cancelTokens.getSettingsRequest.token },
        false,
        false
      )
    ])
      .then(([cats, settings]) => {
        this.setState({
          categories: cats.data,
          loadingCategories: false,
          settings: settings.data
        });
      })
      .catch(err => {
        if (api.checkCancel(err)) {
          return;
        }
        console.log(err);
      });

    if (token) {
      this.cancelTokens.tokenLoginRequest = api.getCancelTokenSource();

      api
        .post(
          "/api/auth/login",
          {},
          { cancelToken: this.cancelTokens.tokenLoginRequest.token },
          true,
          false
        )
        .then(response => {
          window.localStorage.setItem("session", response.data.token);
          this.setState(() => ({
            loggedIn: true,
            user: response.data.user,
            loadingUser: false
          }));
        })
        .catch(err => {
          if (api.checkCancel(err)) {
            return;
          }
          window.localStorage.removeItem("session");
          this.setState(() => ({ loadingUser: false, loggedIn: false }));
          console.log(err.response);
        });
    } else {
      this.setState(() => ({ loadingUser: false, loggedIn: false }));
    }

    if (cartID) {
      this.cancelTokens.getCartRequest = api.getCancelTokenSource();

      api
        .get(
          "/api/cart/" + cartID,
          { cancelToken: this.cancelTokens.getCartRequest.token },
          false,
          false
        )
        .then(response => {
          window.localStorage.setItem("cartSession", response.data.cartID);
          this.setState(() => ({
            cartID: response.data.cartID,
            cart: response.data.cart,
            loadingCart: false
          }));
        })
        .catch(err => {
          if (api.checkCancel(err)) {
            return;
          }
          window.localStorage.removeItem("cartSession");
          this.setState(() => ({ loadingCart: false }));
          console.log(err.response);
        });
    } else {
      this.setState(() => ({ loadingCart: false }));
    }
  }

  componentWillUnmount() {
    this.cancelTokens &&
      Object.keys(this.cancelTokens).forEach(requestKey => {
        this.cancelTokens[requestKey].cancel();
      });
  }

  handleScriptLoad = () => {
    this.setState({ scriptLoaded: true });
  };

  refreshUser = user => {
    this.setState(() => ({ user }));
  };

  addAddress = address => {
    this.cancelTokens.addressPostRequest = api.getCancelTokenSource();

    api
      .post(
        "/api/addresses",
        { id: this.state.user.id, address },
        { cancelToken: this.cancelTokens.addressPostRequest.token },
        true,
        false
      )
      .then(response => {
        this.setState(() => ({ user: response.data }));
      })
      .catch(err => {
        if (api.checkCancel(err)) {
          return;
        }
        console.log(err.response);
      });
  };

  editAddress = (addressID, address) => {
    this.cancelTokens.addressPutRequest = api.getCancelTokenSource();

    api
      .put(
        "/api/addresses",
        { id: this.state.user.id, address, addressID },
        { cancelToken: this.cancelTokens.addressPutRequest.token },
        true,
        false
      )
      .then(response => {
        this.setState(() => ({ user: response.data }));
      })
      .catch(err => {
        if (api.checkCancel(err)) {
          return;
        }
        console.log(err.response);
      });
  };

  deleteAddress = addressID => {
    this.cancelTokens.deleteAddressRequest = api.getCancelTokenSource();

    api
      .post(
        "/api/addresses/remove",
        { id: this.state.user.id, addressID },
        { cancelToken: this.cancelTokens.deleteAddressRequest.token },
        true,
        false
      )
      .then(response => {
        this.setState(() => ({ user: response.data }));
      })
      .catch(err => {
        if (api.checkCancel(err)) {
          return;
        }
        console.log(err.response);
      });
  };

  addToCart = (add, update) => {
    this.cancelTokens.addCartPostRequest = api.getCancelTokenSource();

    api
      .post(
        "/api/cart/add",
        { cartID: this.state.cartID, cartItem: add },
        { cancelToken: this.cancelTokens.addCartPostRequest.token },
        false,
        false
      )
      .then(response => {
        window.localStorage.setItem("cartSession", response.data.cartID);
        this.setState(() => ({
          cartID: response.data.cartID,
          cart: response.data.cart,
          showCartAdded: !update,
          cartItemAdded: !update ? add : null
        }));
      })
      .catch(err => {
        if (api.checkCancel(err)) {
          return;
        }
        console.log(err.response);
      });
  };

  closeCartAdded = () => {
    this.setState(() => ({ showCartAdded: false, cartItemAdded: null }));
  };

  removeFromCart = (id, optionsKey) => {
    this.cancelTokens.removeCartRequest = api.getCancelTokenSource();

    api
      .post(
        "/api/cart/remove",
        { cartID: this.state.cartID, id, optionsKey },
        { cancelToken: this.cancelTokens.removeCartRequest.token },
        false,
        false
      )
      .then(response => {
        this.setState(() => ({ cart: response.data }));
      })
      .catch(err => {
        if (api.checkCancel(err)) {
          return;
        }
        console.log(err.response);
      });
  };

  clearCart = () => {
    this.cancelTokens.clearCartRequest = api.getCancelTokenSource();

    api
      .post(
        "/api/cart/clear",
        { cartID: this.state.cartID },
        { cancelToken: this.cancelTokens.clearCartRequest.token },
        false,
        false
      )
      .then(response => {
        this.setState(() => ({ cart: response.data }));
      })
      .catch(err => {
        if (api.checkCancel(err)) {
          return;
        }
        window.localStorage.removeItem("cartSession");
        console.log(err.response);
      });
  };

  updateCart = (id, optionsKey, quantity) => {
    const cart = this.state.cart;
    let cartItem;

    for (let i = 0; i < cart.length; i++) {
      if (cart[i].productID === id && cart[i].optionsKey === optionsKey) {
        cartItem = cart[i];
        break;
      }
    }

    const quantityChange = quantity - cartItem.quantity;
    cartItem.quantity = quantityChange;

    this.addToCart(cartItem, true);
  };

  getCartSize() {
    return this.state.cart.reduce((acc, item) => {
      return acc + item.quantity;
    }, 0);
  }

  showLogin = e => {
    if (e) e.preventDefault();
    this.setState({ showLogin: true, isRegister: false });
  };

  showRegister = e => {
    if (e) e.preventDefault();
    this.setState({ showLogin: true, isRegister: true });
  };

  onHamburgerClick = () => {
    this.setState({ showSideNav: true });
  };

  closeLogin = () => {
    this.setState({ showLogin: false });
  };

  closeSideNav = () => {
    this.setState({ showSideNav: false });
  };

  onLogin = (formData, cb, errorCb) => {
    this.cancelTokens.loginRequest = api.getCancelTokenSource();

    api
      .post(
        "/api/auth/login",
        formData,
        { cancelToken: this.cancelTokens.loginRequest.token },
        false,
        false
      )
      .then(response => {
        window.localStorage.setItem("session", response.data.token);
        this.setState(() => ({
          loggedIn: true,
          showLogin: false,
          user: response.data.user
        }));
        if (cb) cb();
      })
      .catch(err => {
        if (api.checkCancel(err)) {
          return;
        }
        if (errorCb) errorCb();
        console.log(err.response);
      });
  };

  onRegister = (formData, cb, errorCb) => {
    this.cancelTokens.registerRequest = api.getCancelTokenSource();

    api
      .post(
        "/api/auth/register",
        formData,
        { cancelToken: this.cancelTokens.registerRequest.token },
        false,
        false
      )
      .then(response => {
        window.localStorage.setItem("session", response.data.token);
        this.setState(() => ({
          loggedIn: true,
          showLogin: false,
          user: response.data.user
        }));
        if (cb) cb();
      })
      .catch(err => {
        if (api.checkCancel(err)) {
          return;
        }
        if (errorCb) errorCb();
        console.log(err.response);
      });
  };

  onLogout = e => {
    if (e && e.preventDefault) e.preventDefault();
    this.cancelTokens.logoutRequest = api.getCancelTokenSource();

    api
      .get(
        "/api/auth/logout",
        { cancelToken: this.cancelTokens.logoutRequest.token },
        true,
        false
      )
      .then(() => this.logout())
      .catch(err => {
        if (api.checkCancel(err)) {
          return;
        }
        console.log("Error on logout");
      });
  };

  logout() {
    window.localStorage.removeItem("session");
    this.setState(() => ({ loggedIn: false, user: {} }));
  }

  renderLogin() {
    return (
      <Login
        isRegister={this.state.isRegister}
        showRegister={this.showRegister}
        showLogin={this.showLogin}
        closeLogin={this.closeLogin}
        onLogin={this.onLogin}
        onRegister={this.onRegister}
      />
    );
  }

  render() {
    return (
      <div className={styles.Page}>
        <Header
          loggedIn={this.state.loggedIn}
          onLogout={this.onLogout}
          loadingUser={this.state.loadingUser}
          user={this.state.user}
          showLogin={this.showLogin}
          showRegister={this.showRegister}
          categories={this.state.categories}
          onHamburgerClick={this.onHamburgerClick}
          cartSize={this.getCartSize()}
          settings={this.state.settings}
        />
        <div className={styles.MainBody}>
          <div className={styles.Content}>
            <HelmetProvider>
              <Suspense fallback={<Spinner />}>
                <Switch>
                  <Route
                    path="/"
                    exact
                    render={props => (
                      <Home
                        {...props}
                        storeName={this.state.settings.store_name}
                        metaTitle={this.state.settings.meta_title}
                        metaDescription={this.state.settings.meta_description}
                        categories={this.state.categories}
                        loadingCategories={this.state.loadingCategories}
                      />
                    )}
                  />
                  <Route
                    path="/product/:id"
                    render={props => (
                      <Product
                        {...props}
                        storeName={this.state.settings.store_name}
                        categories={this.state.categories}
                        addToCart={this.addToCart}
                      />
                    )}
                  />
                  <Route
                    path="/category/:any"
                    render={props =>
                      this.state.loadingCategories ? null : (
                        <Category
                          {...props}
                          storeName={this.state.settings.store_name}
                          categories={this.state.categories}
                        />
                      )
                    }
                  />
                  <Route path="/search" component={Products} />
                  <Route
                    path="/checkout/cart"
                    render={props =>
                      this.state.loadingCart ? null : (
                        <Cart
                          {...props}
                          storeName={this.state.settings.store_name}
                          updateCart={this.updateCart}
                          removeFromCart={this.removeFromCart}
                          cart={this.state.cart}
                        />
                      )
                    }
                  />
                  <Route
                    path="/checkout/success"
                    render={props => (
                      <Success
                        {...props}
                        storeName={this.state.settings.store_name}
                      />
                    )}
                  />
                  <Route
                    path="/checkout"
                    render={props =>
                      this.state.loadingUser ||
                      this.state.loadingCart ? null : (
                        <CheckoutWithScript
                          {...props}
                          storeName={this.state.settings.store_name}
                          asyncScriptOnLoad={this.handleScriptLoad}
                          clearCart={this.clearCart}
                          loggedIn={this.state.loggedIn}
                          onLogin={this.onLogin}
                          onRegister={this.onRegister}
                          cart={this.state.cart}
                          cartID={this.state.cartID}
                          user={this.state.user}
                          scriptLoaded={this.state.scriptLoaded}
                        />
                      )
                    }
                  />
                  <Route
                    exact
                    path="/account"
                    render={props =>
                      this.state.loadingUser ? null : (
                        <Profile
                          {...props}
                          storeName={this.state.settings.store_name}
                          refreshUser={this.refreshUser}
                          user={this.state.user}
                        />
                      )
                    }
                  />
                  <Route
                    path="/account/orders"
                    render={props =>
                      this.state.loadingUser ? null : (
                        <Orders
                          {...props}
                          storeName={this.state.settings.store_name}
                          userID={this.state.user.id}
                          loggedIn={this.state.loggedIn}
                        />
                      )
                    }
                  />
                  <Route
                    exact
                    path="/account/addresses"
                    render={props =>
                      this.state.loadingUser ? null : (
                        <Addresses
                          {...props}
                          storeName={this.state.settings.store_name}
                          addAddress={this.addAddress}
                          editAddress={this.editAddress}
                          deleteAddress={this.deleteAddress}
                          user={this.state.user}
                          loggedIn={this.state.loggedIn}
                        />
                      )
                    }
                  />
                  <Route
                    path="/account/order/:id"
                    render={props =>
                      this.state.loadingUser ? null : (
                        <Order
                          {...props}
                          storeName={this.state.settings.store_name}
                          loggedIn={this.state.loggedIn}
                          user={this.state.user}
                        />
                      )
                    }
                  />
                  <Route
                    path="/:page"
                    render={props => (
                      <Page
                        {...props}
                        storeName={this.state.settings.store_name}
                      />
                    )}
                  />
                </Switch>
              </Suspense>
            </HelmetProvider>
            {!this.state.showLogin ? null : (
              <Modal close={this.closeLogin}>
                <Login
                  isRegister={this.state.isRegister}
                  showRegister={this.showRegister}
                  showLogin={this.showLogin}
                  closeLogin={this.closeLogin}
                  onLogin={this.onLogin}
                  onRegister={this.onRegister}
                />
              </Modal>
            )}
            {!this.state.showCartAdded ? null : (
              <Modal
                close={this.closeCartAdded}
                renderContent={close => (
                  <CartAdded
                    cartItem={this.state.cartItemAdded}
                    close={close}
                  />
                )}
              />
            )}
          </div>
        </div>
        <Footer />
        <SideNav
          loggedIn={this.state.loggedIn}
          onLogout={this.onLogout}
          categories={this.state.categories}
          show={this.state.showSideNav}
          closeSideNav={this.closeSideNav}
          showLogin={this.showLogin}
          showRegister={this.showRegister}
          storeName={this.state.settings.store_name}
        />
      </div>
    );
  }
}

export default Storefront;