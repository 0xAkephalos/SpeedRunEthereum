import React, { useCallback, useEffect, useState } from "react";
import { useLocation, Switch, Route, Link } from "react-router-dom";
import "antd/dist/antd.css";
import { StaticJsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import "./App.css";
import { Menu } from "antd";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { useUserAddress } from "eth-hooks";
import axios from "axios";
import { useUserProvider } from "./hooks";
import { Header, Account, ThemeSwitch } from "./components";
import { INFURA_ID, NETWORKS, SERVER_URL as serverUrl } from "./constants";
import {
  BuilderListView,
  ChallengeDetailView,
  BuilderHomeView,
  BuilderProfileView,
  ChallengeReviewView,
  HomeView,
} from "./views";

/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS.mainnet; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
// attempt to connect to our own scaffold eth rpc and if that fails fall back to infura...
// Using StaticJsonRpcProvider as the chainId won't change see https://github.com/ethers-io/ethers.js/issues/901
const scaffoldEthProvider = new StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544");
const mainnetInfura = new StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID);
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_I

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new StaticJsonRpcProvider(localProviderUrlFromEnv);

// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

const USER_ROLES = {
  admin: "user_role.administrator",
  anonymous: "user_role.anonymous",
  registered: "user_role.registered",
};

/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  // network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: INFURA_ID,
      },
    },
  },
});

const logoutOfWeb3Modal = async () => {
  await web3Modal.clearCachedProvider();
  setTimeout(() => {
    window.location.reload();
  }, 1);
};

function App() {
  const mainnetProvider = scaffoldEthProvider && scaffoldEthProvider._network ? scaffoldEthProvider : mainnetInfura;

  const [injectedProvider, setInjectedProvider] = useState();

  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProvider = useUserProvider(injectedProvider);
  const address = useUserAddress(userProvider);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId = userProvider && userProvider._network && userProvider._network.chainId;

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (DEBUG && mainnetProvider && address && selectedChainId) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
    }
  }, [mainnetProvider, address, selectedChainId]);

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new Web3Provider(provider));
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const location = useLocation();
  const [userRole, setUserRole] = useState(USER_ROLES.anonymous);

  useEffect(() => {
    async function fetchUserData() {
      console.log("getting user data");
      try {
        const fetchedUserObject = await axios.get(serverUrl + `/user`, {
          params: { address },
        });
        setUserRole(fetchedUserObject.data.isAdmin ? USER_ROLES.admin : USER_ROLES.registered);
      } catch (e) {
        setUserRole(USER_ROLES.anonymous);
      }
    }

    if (address) {
      fetchUserData();
    }
  }, [address]);

  const isSignerProviderConnected =
    injectedProvider && injectedProvider.getSigner && injectedProvider.getSigner()._isSigner;

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header />

      <ThemeSwitch />

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ textAlign: "center", padding: 10 }}>
        <Account
          connectText="Connect Ethereum Wallet"
          onlyShowButton={!isSignerProviderConnected}
          address={address}
          mainnetProvider={mainnetProvider}
          web3Modal={web3Modal}
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={() => {
            logoutOfWeb3Modal();
            setUserRole(USER_ROLES.anonymous);
          }}
          blockExplorer={blockExplorer}
          isAdmin={userRole === USER_ROLES.admin}
        />
      </div>
      <>
        <Menu
          style={{ textAlign: "center", marginBottom: "25px" }}
          selectedKeys={[location.pathname]}
          mode="horizontal"
        >
          <Menu.Item key="/">
            <Link to="/">Home</Link>
          </Menu.Item>
          <Menu.Item key="/builders">
            <Link to="/builders">All Builders</Link>
          </Menu.Item>
          {isSignerProviderConnected && (
            <Menu.Item key="/my-profile">
              <Link to="/my-profile">My profile</Link>
            </Menu.Item>
          )}
          {USER_ROLES.admin === userRole && (
            <Menu.Item key="/challenge-review">
              <Link to="/challenge-review">Review Challenges</Link>
            </Menu.Item>
          )}
        </Menu>
        <Switch>
          <Route exact path="/">
            <HomeView serverUrl={serverUrl} address={address} userProvider={userProvider} />
          </Route>
          <Route exact path="/my-profile">
            <BuilderHomeView serverUrl={serverUrl} address={address} />
          </Route>
          <Route path="/builders" exact>
            <BuilderListView serverUrl={serverUrl} mainnetProvider={mainnetProvider} />
          </Route>
          <Route path="/builders/:builderAddress">
            <BuilderProfileView serverUrl={serverUrl} mainnetProvider={mainnetProvider} />
          </Route>
          <Route path="/challenge/:challengeId">
            <ChallengeDetailView serverUrl={serverUrl} address={address} userProvider={userProvider} />
          </Route>
          {/* ToDo: Protect this route on the frontend? */}
          <Route path="/challenge-review" exact>
            <ChallengeReviewView serverUrl={serverUrl} address={address} userProvider={userProvider} />
          </Route>
        </Switch>
      </>
    </div>
  );
}

if (window.ethereum) {
  window.ethereum.on("chainChanged", () => {
    if (web3Modal.cachedProvider) {
      setTimeout(() => {
        window.location.reload();
      }, 1);
    }
  });

  window.ethereum.on("accountsChanged", () => {
    if (web3Modal.cachedProvider) {
      setTimeout(() => {
        window.location.reload();
      }, 1);
    }
  });
}

export default App;
