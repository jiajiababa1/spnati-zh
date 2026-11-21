/* zhCheat.js - 必赢外挂开关 + 图鉴入口 (中文版附加功能)
 * 原理: 游戏自带 Deck.rigFor() 调试函数, 能把牌组顶端码成同花大顺 (10-J-Q-K-A 同花)。
 * 发牌顺序是玩家先发 5 张, 所以在 setupDeck() 洗牌后调用 rigFor(0), 玩家起手就是同花顺。
 * 另外在换牌和摊牌前再兜底一次, 保证玩家手牌始终是同花顺, 不可能输。
 */
(function () {
    var KEY = 'spnati.alwaysWin';
    function enabled() {
        var v = null;
        try { v = localStorage.getItem(KEY); } catch (e) {}
        return v === null ? true : v === '1'; // 默认开启
    }
    function setEnabled(on) {
        try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
        render();
    }
    function royalFlushCards() {
        var suit = Math.floor(Math.random() * 4);
        return [14, 13, 12, 11, 10].map(function (rank) { return new Card(suit, rank); });
    }
    function forceHumanRoyalFlush() {
        if (typeof humanPlayer === 'undefined' || !humanPlayer || !humanPlayer.hand) return;
        if (humanPlayer.out) return;
        humanPlayer.hand.cards = royalFlushCards();
        humanPlayer.hand.determine();
    }
    function wrap() {
        if (window.__zhCheatWrapped) return;
        if (typeof setupDeck !== 'function' || typeof completeRevealPhase !== 'function') return;
        window.__zhCheatWrapped = true;

        var origSetupDeck = setupDeck;
        setupDeck = function () {
            origSetupDeck();
            if (enabled() && typeof activeDeck !== 'undefined' && activeDeck && activeDeck.rigFor) {
                activeDeck.rigFor(0); // 玩家 (0 号位) 起手同花顺
            }
        };

        var origExchange = exchangeCards;
        exchangeCards = function (player) {
            origExchange(player);
            if (enabled() && player === 0) { // HUMAN_PLAYER = 0
                forceHumanRoyalFlush();
                if (typeof displayHand === 'function') displayHand(0, null);
            }
        };

        var origReveal = completeRevealPhase;
        completeRevealPhase = function () {
            if (enabled() && typeof humanPlayer !== 'undefined' && humanPlayer && humanPlayer.hand) {
                humanPlayer.hand.determine();
                if (humanPlayer.hand.strength !== 10) { // ROYAL_FLUSH = 10
                    forceHumanRoyalFlush();
                }
            }
            origReveal();
        };
    }
    function render() {
        var btn = document.getElementById('zh-cheat-toggle');
        if (!btn) return;
        btn.textContent = '必赢外挂：' + (enabled() ? '开' : '关');
        btn.style.background = enabled() ? '#b3392e' : 'rgba(30,25,20,0.85)';
    }
    function mount() {
        wrap();
        if (document.getElementById('zh-cheat-bar')) { render(); return; }
        var bar = document.createElement('div');
        bar.id = 'zh-cheat-bar';
        bar.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:99999;display:flex;gap:8px;';
        var btn = document.createElement('button');
        btn.id = 'zh-cheat-toggle';
        btn.style.cssText = 'color:#fff;border:1px solid #fff3;border-radius:99px;padding:8px 14px;font-size:14px;cursor:pointer;';
        btn.onclick = function () { setEnabled(!enabled()); };
        var gal = document.createElement('a');
        gal.href = 'gallery.html';
        gal.textContent = '全角色图鉴';
        gal.style.cssText = 'color:#fff;background:rgba(30,25,20,0.85);border:1px solid #fff3;border-radius:99px;padding:8px 14px;font-size:14px;text-decoration:none;';
        bar.appendChild(btn);
        bar.appendChild(gal);
        document.body.appendChild(bar);
        render();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
