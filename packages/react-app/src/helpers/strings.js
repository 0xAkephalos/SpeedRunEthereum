// Update after merge.
export const ALLOWED_TESTNETS = ["rinkeby", "kovan", "ropsten", "goerli", "sepolia"];

export const ellipsizedAddress = longAddress =>
  longAddress ? `${longAddress.slice(0, 6)}...${longAddress.slice(-4)}` : "";

export const parseGithubReadme = text =>
  text
    .replace("# 🏗 scaffold-eth | 🏰 BuidlGuidl", "")
    .replace(/🏆.*?🍾/g, "")
    .replace(/🎖.*?🎖/g, "");

export const isValidUrl = urlText => {
  let url;

  try {
    url = new URL(urlText);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
};

export const isValidEtherscanTestnetUrl = urlText => {
  let url;

  try {
    url = new URL(urlText);
  } catch (_) {
    return false;
  }

  const network = url.host.split(".")[0];
  return network && ALLOWED_TESTNETS.includes(network);
};

export const isBoolean = val => typeof val === "boolean";
