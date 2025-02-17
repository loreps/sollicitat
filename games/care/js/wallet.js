class WalletConnection {
    constructor() {
        this.isConnected = false;
        this.account = null;
    }

    async connectWallet() {
        try {
            // Check if MetaMask is installed
            if (typeof window.ethereum !== 'undefined') {
                // Request account access
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.account = accounts[0];
                this.isConnected = true;
                this.updateWalletButton();
                return true;
            } else {
                alert('Please install MetaMask to connect your wallet!');
                return false;
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            return false;
        }
    }

    updateWalletButton() {
        const walletBtn = document.getElementById('walletButton');
        if (this.isConnected && walletBtn) {
            walletBtn.textContent = this.account.slice(0, 6) + '...' + this.account.slice(-4);
            walletBtn.classList.add('connected');
        }
    }

    getAccount() {
        return this.account;
    }

    isWalletConnected() {
        return this.isConnected;
    }
}

const walletConnection = new WalletConnection();
