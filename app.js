
/* Web3 Asset Viewer
     • alchemy JSON-RPC for balances & token metadata
     • coinGecko native price fallbacks
     • ERC20 price fetch via DexScreener
     • NFT fetch via Alchemy endpoint
     • sortable token table
     • tabs : tokens / NFTs */


/* - CONFIG - */

const ALCHEMY_KEY = "722g6REH9Nsxsj0UjfHFK"; // this is free API key so i made it public anyways don't use any one i'll get rate limits ('_')

// alchemy end-points
const CHAIN_RPC = {
  ethereum: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  bnb: `https://bnb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  polygon: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  arbitrum: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  optimism: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  base: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  scroll: `https://scroll-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  linea: `https://linea-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  zora: `https://zora-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  ink: `https://ink-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
};

// native token api / chain info used across UI & price lookups
const CHAIN_INFO = {
  ethereum: {
    name: "Ethereum",
    symbol: "ETH",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    pairUrl:
      "https://api.dexscreener.com/latest/dex/pairs/ethereum/0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"
  },
  bnb: {
    name: "BNB Smart Chain",
    symbol: "BNB",
    image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
    pairUrl: "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd"
  },
  polygon: {
    name: "Polygon",
    symbol: "MATIC",
    image: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png",
    pairUrl: "https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd"
  },
  arbitrum: {
    name: "Arbitrum",
    symbol: "ETH",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    pairUrl:
      "https://api.dexscreener.com/latest/dex/pairs/ethereum/0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"
  },
  optimism: {
    name: "Optimism",
    symbol: "ETH",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    pairUrl:
      "https://api.dexscreener.com/latest/dex/pairs/ethereum/0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"
  },
  base: {
    name: "Base",
    symbol: "ETH",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    pairUrl:
      "https://api.dexscreener.com/latest/dex/pairs/ethereum/0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"
  },
  scroll: {
    name: "Scroll",
    symbol: "ETH",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    pairUrl:
      "https://api.dexscreener.com/latest/dex/pairs/ethereum/0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"
  },
  linea: {
    name: "Linea",
    symbol: "ETH",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    pairUrl:
      "https://api.dexscreener.com/latest/dex/pairs/ethereum/0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"
  },
  zora: {
    name: "Zora",
    symbol: "ETH",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    pairUrl:
      "https://api.dexscreener.com/latest/dex/pairs/ethereum/0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"
  },
  ink: {
    name: "Ink",
    symbol: "ETH",
    image: "https://inkonchain.com/logo/ink-mark-dark.webp",
    pairUrl:
      "https://api.dexscreener.com/latest/dex/pairs/ethereum/0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"
  }
};

/* -- DOM references -- */
const assetForm = document.getElementById("asset-form");
const walletInput = document.getElementById("wallet-address");
const chainSelect = document.getElementById("chain-select");

const resultsContainer = document.getElementById("results-container") || document.getElementById("results-box");
const loadingSpinner = document.getElementById("loading-spinner") || document.getElementById("loading-box");
const errorMessage = document.getElementById("error-message") || document.getElementById("error-box");
const dataDisplay = document.getElementById("data-display") || document.getElementById("data-box");

const tabTokens = document.getElementById("tab-tokens");
const tabNfts = document.getElementById("tab-nfts");
const contentTokens = document.getElementById("content-tokens") || document.getElementById("token-section");
const contentNfts = document.getElementById("content-nfts") || document.getElementById("nft-section");
const tabIndicator = document.getElementById("tab-indicator") || document.getElementById("tab-line");


/* --- local state --- */

let visibleTokens = [];
let currentSort = { key: "value", asc: false };


 /* ---- smol helper to call Alchemy JSON-RPC endpoints ---- */

async function askAlchemy(endpoint, method, params) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: 1, jsonrpc: "2.0", method, params })
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

function stringToHue(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}


/* ----- fetching tokens & NFTs ----- */

/** * load available erc20 tokens from wallet
    * to fetch native balance and ERC20 tokens + metadata we use alchemy JSON-RPC and DexScreener api to Fetches erc20 tokens */

async function loadWalletTokens(address, chain) {
  const endpoint = CHAIN_RPC[chain];
  if (!endpoint) throw new Error(`Unsupported chain: ${chain}`);

  const tokens = [];
  const nativeBalanceHex = await askAlchemy(endpoint, "eth_getBalance", [address, "latest"]);
  const nativeBalance = parseInt(nativeBalanceHex, 16) / 1e18;

  // list if only min. native balance found
  if (nativeBalance > 0.00001) {
    const nativePrice = await getNativePrice(chain);
    const usdValue = nativePrice ? (nativeBalance * nativePrice).toFixed(2) : null;

    tokens.push({
      ...CHAIN_INFO[chain],
      balance: nativeBalance.toFixed(6),
      price: nativePrice,
      usdValue
    });
  }

  // list if erc20 tokens found
  const balancesResponse = await askAlchemy(endpoint, "alchemy_getTokenBalances", [address, "erc20"]);
  const nonZeroBalances = balancesResponse.tokenBalances.filter(
    token =>
      token.tokenBalance !==
      "0x0000000000000000000000000000000000000000000000000000000000000000"
  );

  // token metadata
  const metadataPromises = nonZeroBalances.map(token =>
    askAlchemy(endpoint, "alchemy_getTokenMetadata", [token.contractAddress])
  );
  const metadataResults = await Promise.all(metadataPromises);
  const priceData = await getTokenPrices(nonZeroBalances, chain);
  for (let i = 0; i < metadataResults.length; i++) {
    const meta = metadataResults[i];
    const balanceData = nonZeroBalances[i];

    if (!meta.decimals) continue;

    const contract = balanceData.contractAddress.toLowerCase();
    const balance = parseInt(balanceData.tokenBalance, 16) / Math.pow(10, meta.decimals);
    const priceInfo = priceData[contract]?.usd || null;
    const usdValue = priceInfo ? (balance * priceInfo).toFixed(2) : null;

    tokens.push({
      name: meta.name || "Unknown Token",
      symbol: meta.symbol || "???",
      image: meta.logo,
      balance: balance.toFixed(4),
      price: priceInfo,
      usdValue,
      contractAddress: contract
    });
  }

  return tokens;
}

/** * load available nfts from wallet
    * we use alchemy's REST endpoint for nft fetching, currently ink chain doesn't support this so return a placeholder message (SDK not available)*/

async function loadWalletNfts(address, chain) {
  if (chain === "ink") {
    console.warn("NFT API not yet available for Ink chain.");
    return [{
      name: "NFT fetching not supported yet",
      collection: "Ink Chain",
      image: "https://placehold.co/300x300/334155/94a3b8?text=Ink+NFTs+Coming+Soon"
    }];
  }

  const CHAIN_URLS = {
    ethereum: "eth-mainnet",
    bnb: "bnb-mainnet",
    polygon: "polygon-mainnet",
    arbitrum: "arb-mainnet",
    optimism: "opt-mainnet",
    base: "base-mainnet",
    scroll: "scroll-mainnet",
    linea: "linea-mainnet",
    zora: "zora-mainnet",
    ink: "ink-mainnet"
  };

  const base = CHAIN_URLS[chain];
  if (!base) throw new Error(`Unsupported chain: ${chain}`);

  const baseUrl = `https://${base}.g.alchemy.com/v2/${ALCHEMY_KEY}`;
  const url = `${baseUrl}/getNFTsForOwner?owner=${address}&withMetadata=true&pageSize=40`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
  const data = await response.json();

  if (!data.ownedNfts) return [];

  return data.ownedNfts.map(nft => {
    const imageUrl =
      nft.image?.cachedUrl ||
      nft.image?.originalUrl ||
      nft.media?.[0]?.gateway ||
      nft.media?.[0]?.raw ||
      "";

    return {
      name: nft.name || `${nft.contract?.name || "NFT"} #${nft.tokenId}`,
      collection: nft.contract?.name || "Unknown Collection",
      image: imageUrl
    };
  });
}


/* ------ Price fetching ------ */

/** * get erc20 Token Prices
    * we try to fetch token prices from DexScreener for the token array returned by alchemy */

async function getTokenPrices(tokens, Chain) {
  const results = {};

  const requests = tokens.map(async (b) => {
    const contract = b.contractAddress.toLowerCase();
    const url = `https://api.dexscreener.com/latest/dex/tokens/${contract}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      const price = data.pairs?.[0]?.priceUsd;
      if (price) {
        results[contract] = { usd: parseFloat(price) };
      } else {
        console.warn(`No price found for ${contract}`);
      }
    } catch (e) {
      console.warn("DexScreener fetch failed for:", contract, e.message);
    }
  });

  await Promise.all(requests);
  return results;
}

/** * get native token Price 
    * if you look CHAIN_INFO i gave ETH-like chains (Base, Arbitrum, Optimism, Scroll, Linea, Ink) same DexScreener api URLs for quick pair price lookups.
    *  while BNB, MATIC use coinGecko's simple price endpoint because a reliable DexScreener pair was not available for these
    * If you later discover a stable DexScreener pair for a chain, replace the api_Url in CHAIN_INFO */

async function getNativePrice(chain) {
  const info = CHAIN_INFO[chain];
  if (!info || !info.pairUrl) return 0;

  try {
    const res = await fetch(info.pairUrl);
    const data = await res.json();

    // DexScreener
    if (data?.pair?.priceUsd) return parseFloat(data.pair.priceUsd);

    // CoinGecko
    if (data?.binancecoin?.usd) return data.binancecoin.usd;
    if (data["matic-network"]?.usd) return data["matic-network"].usd;

    return 0;
  } catch (e) {
    console.warn(`⚠️ Native price fetch failed for ${chain}:`, e);
    return 0;
  }
}

/* ------- Token UI------- */

/** show availabe Tokens and nfts */

function showTokens(tokens) {
  visibleTokens = tokens;
  drawTokenTable(tokens);
}

function drawTokenTable(tokens) {
  const container = contentTokens;
  container.innerHTML = "";

  if (!tokens || tokens.length === 0) {
    container.innerHTML = `<p class="text-slate-400 text-center py-8">No tokens found.</p>`;
    return;
  }

  const table = document.createElement("table");
  table.className = "min-w-full divide-y divide-slate-700";

  table.innerHTML = `
    <thead class="bg-slate-800 sticky top-0 z-10 select-none">
      <tr>
        <th data-key="name" class="sortable py-3.5 px-4 text-left text-sm font-semibold text-white cursor-pointer transition-all">Token</th>
        <th class="py-3.5 px-4 text-left text-sm font-semibold text-white">Balance</th>
        <th data-key="price" class="sortable py-3.5 px-4 text-left text-sm font-semibold text-white cursor-pointer transition-all">Price (USD)</th>
        <th data-key="value" class="sortable py-3.5 px-4 text-left text-sm font-semibold text-white cursor-pointer transition-all">Value (USD)</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-700"></tbody>
  `;

  const tbody = table.querySelector("tbody");

  tokens.forEach(token => {
    const row = document.createElement("tr");
    row.className = "hover:bg-slate-700/50 transition";

    // color gradient when token image is missing
    const hue = stringToHue(token.symbol || token.name || "X");
    const imageHTML = token.image
      ? `<img src="${token.image}" alt="${token.name}" class="h-10 w-10 rounded-full bg-slate-700 object-cover">`
      : `<div class="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm uppercase shadow-md"
           style="background: linear-gradient(135deg, hsl(${hue}, 80%, 55%), hsl(${(hue + 60) % 360}, 80%, 50%));">
           ${token.name ? token.name[0] : "?"}
         </div>`;

    row.innerHTML = `
      <td class="whitespace-nowrap py-4 px-4 flex items-center gap-3">
        ${imageHTML}
        <div>
          <div class="font-medium text-white">${token.name}</div>
          <div class="text-sm text-slate-400">${token.symbol}</div>
        </div>
      </td>
      <td class="py-4 px-4 text-white">${token.balance}</td>
      <td class="py-4 px-4 text-slate-300">${token.price ? `$${Number(token.price).toFixed(4)}` : "-"}</td>
      <td class="py-4 px-4 text-cyan-400 font-semibold">${token.usdValue ? `$${token.usdValue}` : "-"}</td>
    `;

    tbody.appendChild(row);
  });

  container.appendChild(table);

  // enable sorting tokens through arrows 
  table.querySelectorAll(".sortable").forEach(th => {
    const key = th.dataset.key;
    let arrow = "";

    if (currentSort.key === key) {
      arrow = currentSort.asc ? "▲" : "▼";
      th.classList.add("text-cyan-400", "scale-[1.05]");
    } else {
      th.classList.remove("text-cyan-400", "scale-[1.05]");
    }

    th.innerHTML = `${th.textContent.split(" ")[0]} <span class="ml-1 text-xs">${arrow}</span>`;
    th.onclick = () => {
      if (currentSort.key === key) currentSort.asc = !currentSort.asc;
      else currentSort = { key, asc: false };
      sortTokens();
    };
  });
}

/** enable clickable sorting */

function sortTokens() {
  let sorted = [...visibleTokens];

  switch (currentSort.key) {
    case "name":
      sorted.sort((a, b) =>
        currentSort.asc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      );
      break;
    case "price":
      sorted.sort((a, b) =>
        currentSort.asc ? (a.price || 0) - (b.price || 0) : (b.price || 0) - (a.price || 0)
      );
      break;
    case "value":
      sorted.sort((a, b) =>
        currentSort.asc ? (a.usdValue || 0) - (b.usdValue || 0) : (b.usdValue || 0) - (a.usdValue || 0)
      );
      break;
  }

  drawTokenTable(sorted);
}


/* -------- NFTs UI -------- */

/** show available Nfts from wallet */

function showNfts(nfts) {
  contentNfts.innerHTML = "";

  if (!nfts || nfts.length === 0) {
    contentNfts.innerHTML = `<p class="text-slate-400 text-center py-8">No NFTs found.</p>`;
    return;
  }

  const grid = document.createElement("div");
  grid.className = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4";

  nfts.forEach(nft => {
    const card = document.createElement("div");
    card.className =
      "bg-slate-700 rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105 hover:shadow-cyan-500/20";
    card.innerHTML = `
      <div class="aspect-square bg-slate-600">
        <img src="${nft.image}" alt="${nft.name}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/300x300/334155/94a3b8?text=NFT'">
      </div>
      <div class="p-3">
        <h3 class="font-bold text-white truncate" title="${nft.name}">${nft.name}</h3>
        <p class="text-sm text-slate-400 truncate" title="${nft.collection}">${nft.collection}</p>
      </div>
    `;
    grid.appendChild(card);
  });

  contentNfts.appendChild(grid);
}

/* --------- Tabs, errors --------- */

/** switch between token and nft tabs */

function setTabView(tab) {
  if (!tabIndicator) return;
  if (tab === "tokens") {
    tabTokens.classList.add("text-white");
    tabTokens.classList.remove("text-slate-400");

    tabNfts.classList.add("text-slate-400");
    tabNfts.classList.remove("text-white");

    contentTokens.classList.remove("hidden");
    contentNfts.classList.add("hidden");

    tabIndicator.classList.remove("nfts");
  } else {
    tabNfts.classList.add("text-white");
    tabNfts.classList.remove("text-slate-400");

    tabTokens.classList.add("text-slate-400");
    tabTokens.classList.remove("text-white");

    contentNfts.classList.remove("hidden");
    contentTokens.classList.add("hidden");

    tabIndicator.classList.add("nfts");
  }
}

/** show a user-friendly error box and hide loading/data*/

function displayError(msg) {
  if (!errorMessage) {
    console.error("Error:", msg);
    return;
  }
  errorMessage.textContent = msg;
  errorMessage.classList.remove("hidden");
  if (loadingSpinner) loadingSpinner.classList.add("hidden");
  if (dataDisplay) dataDisplay.classList.add("hidden");
}

/** * this handles the form submission when the user searches a wallet
    * validates the address and fetches token & nft paralally for speed */

async function onSearch(e) {
  e.preventDefault();

  const address = walletInput.value.trim();
  const chain = chainSelect.value;

  if (!address) return displayError("Please enter a wallet address.");
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return displayError("Invalid wallet address format.");
  if (!ALCHEMY_KEY || ALCHEMY_KEY === "YOUR_API_KEY_HERE") return displayError("Please add your Alchemy API key in app.js");

  if (resultsContainer) resultsContainer.classList.remove("hidden");
  if (loadingSpinner) loadingSpinner.classList.remove("hidden");
  if (dataDisplay) dataDisplay.classList.add("hidden");
  if (errorMessage) errorMessage.classList.add("hidden");

  try {
    // Fetch tokens, nfts paralally for speed
    const [tokenData, nftData] = await Promise.all([
      loadWalletTokens(address, chain),
      loadWalletNfts(address, chain)
    ]);

    showTokens(tokenData);
    showNfts(nftData);

    if (loadingSpinner) loadingSpinner.classList.add("hidden");
    if (dataDisplay) dataDisplay.classList.remove("hidden");

    setTabView("tokens");
  } catch (err) {
    console.error("Fetch error:", err);
    displayError(err.message || "An unknown error occurred.");
  }
}

/* ---------- Init listeners ---------- */

assetForm.addEventListener("submit", onSearch);
if (tabTokens) tabTokens.addEventListener("click", () => setTabView("tokens"));
if (tabNfts) tabNfts.addEventListener("click", () => setTabView("nfts"));

/* tx for coming till end */
