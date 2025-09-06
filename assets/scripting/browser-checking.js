// Checks the browser for possible use of VPN's, proxies, Tor or web scrapers & Bots. Simple for now, will change this to server-sided checks in the future.

(function(){
    const security = {};

    security.isBot = () => {
        const ua = navigator.userAgent.toLowerCase();
        const botPatterns = [/bot/, /crawl/, /spider/, /slurp/, /headless/, /phantom/];
        const isHeadless = !!window.callPhantom || !!window._phantom || navigator.webdriver;
        return botPatterns.some(pattern => pattern.test(ua)) || isHeadless;
    };

    security.isTor = () => {
        return navigator.userAgent.includes('TorBrowser') || (navigator.plugins.length === 0 && navigator.mimeTypes.length === 0);
    };

    security.checkNetworkDelays = async () => {
        const testUrls = [
            'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
            'https://www.cloudflare.com/cdn-cgi/trace'
        ];
        const results = [];
        for(const url of testUrls){
            const start = performance.now();
            try{
                await fetch(url, {method:'HEAD', cache:'no-cache', mode:'no-cors'});
                results.push(performance.now() - start);
            } catch(e){
                results.push(-1);
            }
        }
        return results;
    };

    security.analyzeDelays = (delays) => {
        const validDelays = delays.filter(d => d >= 0);
        if(validDelays.length === 0) return null;
        const avg = validDelays.reduce((a,b)=>a+b,0)/validDelays.length;
        return avg > 200 ? 'High Latency - Possible VPN / Proxy / Intercepted' : 'Normal Latency';
    };

    security.detectPublicIP = () => {
        return new Promise(resolve => {
            let ipDetected = false;
            try {
                const pc = new RTCPeerConnection({iceServers:[]});
                pc.createDataChannel('');
                pc.createOffer().then(offer => pc.setLocalDescription(offer));
                pc.onicecandidate = (event) => {
                    if(event.candidate && event.candidate.candidate){
                        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
                        const match = ipRegex.exec(event.candidate.candidate);
                        if(match){
                            const ip = match[1];
                            const privatePattern = /^10\.|^192\.168\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./;
                            if(!privatePattern.test(ip)) ipDetected = true;
                        }
                    }
                    if(event.candidate === null) resolve(ipDetected);
                };
            } catch(e){
                resolve(false);
            }
        });
    };

    security.getBrowserInfo = () => {
        const ua = navigator.userAgent;
        const platform = navigator.platform;
        const vendor = navigator.vendor;
        return {ua, platform, vendor};
    };

    security.getDeviceInfo = () => {
        const cores = navigator.hardwareConcurrency || 'unknown';
        const memory = navigator.deviceMemory || 'unknown';
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const pixelRatio = window.devicePixelRatio;
        return {cores, memory, screenWidth, screenHeight, pixelRatio};
    };

    async function runBrowserCheck(){
        const botDetected = security.isBot();
        const torDetected = security.isTor();
        const publicIPDetected = await security.detectPublicIP();
        const delays = await security.checkNetworkDelays();
        const latencyAnalysis = security.analyzeDelays(delays);
        const browserInfo = security.getBrowserInfo();
        const deviceInfo = security.getDeviceInfo();

        const results = {
            bot: botDetected,
            tor: torDetected,
            publicIP: publicIPDetected,
            networkLatency: latencyAnalysis,
            rawDelays: delays,
            browserInfo,
            deviceInfo
        };

        console.log('Browser checking results:', results);
    }

    runBrowserCheck();
})();