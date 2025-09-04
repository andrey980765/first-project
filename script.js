let points = 0;
    let clickPower = 1;
    let time = 0;
    let upgrades = [];
    let upgradeEffects = [];
    let timerInterval;
    const upgradesDiv = document.getElementById("upgrades");
    const upgradesContainer = document.getElementById("upgradesContainer");
    const upgradeNotification = document.getElementById("upgradeNotification");

    const music = new Howl({
      src: ['https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'],
      autoplay: true,
      loop: true,
      volume: 0.3
    });

    const clickSound = new Howl({
      src: ['https://freesound.org/data/previews/256/256113_3263906-lq.mp3']
    });

    function createUpgrade(name, baseCost, type, baseEffect) {
      return {
        name,
        baseCost,
        cost: baseCost,
        type,
        baseEffect,
        effect: baseEffect,
        level: 0,
        boostPurchased: false
      };
    }

    function generateUpgrades() {
      upgrades = [
        createUpgrade("Auto Clicker", 50, "passive", 1),
        createUpgrade("Double Click", 100, "click", 1),
        ...Array.from({ length: 10 }, (_, i) =>
          createUpgrade(`Passive Booster ${i + 1}`, 200 * (i + 1), "passive", 5 * (i + 1))
        )
      ];
    }

    function renderUpgrades() {
      upgradesDiv.innerHTML = '';
      let hasAvailable = false;
      upgrades.forEach((upg, index) => {
        const div = document.createElement("div");
        div.className = "upgrade";

        if (upg.level >= 100) div.classList.add("level100");
        else if (upg.level >= 75) div.classList.add("level75");
        else if (upg.level >= 50) div.classList.add("level50");
        else if (upg.level >= 25) div.classList.add("level25");

        if (points >= upg.cost && upg.level < 100) {
          div.classList.add("available");
          hasAvailable = true;
        }

        div.innerHTML = `
          <p>${upg.name} (Level ${upg.level})</p>
          <p>Cost: ${Math.floor(upg.cost)}</p>
          <button onclick="buyUpgrade(${index})" ${points < upg.cost || upg.level >= 100 ? 'disabled' : ''}>Upgrade</button>
          ${upg.level >= 25 && !upg.boostPurchased ? `<button onclick="buyBoost(${index})">Buy Boost</button>` : ''}
        `;
        upgradesDiv.appendChild(div);
      });
      upgradeNotification.style.display = hasAvailable ? 'flex' : 'none';
    }

    function buyUpgrade(index) {
      const upg = upgrades[index];
      if (points >= upg.cost && upg.level < 100) {
        points -= upg.cost;
        upg.level++;
        upg.cost *= 1.25;
        if (upg.type === "click") clickPower += upg.effect;
        if (upg.type === "passive") upgradeEffects[index] = (upgradeEffects[index] || 0) + upg.effect;
        renderUpgrades();
        updateUI();
        saveGame();
      }
    }

    function buyBoost(index) {
      const upg = upgrades[index];
      const boostCost = upg.cost * 2;
      if (points >= boostCost) {
        points -= boostCost;
        upg.boostPurchased = true;
        if (upg.type === "click") upg.effect *= 1.5;
        if (upg.type === "passive") upg.effect *= 1.5;
        upg.cost *= 0.9;
        renderUpgrades();
        updateUI();
        saveGame();
      }
    }

    function applyPassiveIncome() {
      setInterval(() => {
        upgradeEffects.forEach(effect => {
          points += effect || 0;
        });
        updateUI();
        checkEasterEgg();
        renderUpgrades();
        saveGame();
      }, 1000);
    }

    function updateUI() {
      document.getElementById("points").textContent = Math.floor(points);
    }

    function saveGame() {
      localStorage.setItem('clickerGame', JSON.stringify({ points, clickPower, time, upgrades }));
    }

    function loadGame() {
      generateUpgrades();
      const data = JSON.parse(localStorage.getItem('clickerGame'));
      if (data) {
        points = data.points;
        clickPower = data.clickPower;
        time = data.time;

        data.upgrades.forEach((savedUpg, i) => {
          const base = upgrades[i];
          upgrades[i] = {
            ...base,
            ...savedUpg,
          };

          if (savedUpg.type=== "click") {
            clickPower += base.effect * savedUpg.level;
          } else if (savedUpg.type === "passive") {
            upgradeEffects[i] = base.effect * savedUpg.level;
          }
        });
      }
    }

    function resetGame() {
      if (confirm("Are you sure you want to reset all progress?")) {
        localStorage.removeItem('clickerGame');
        location.reload();
      }
    }

    function startTimer() {
      timerInterval = setInterval(() => {
        time++;
        document.getElementById("timer").textContent = time + 's';
        saveGame();
      }, 1000);
    }

    function checkEasterEgg() {
      if (points >= 42 && document.getElementById("easterEgg").classList.contains("hidden")) {
        document.getElementById("easterEgg").classList.remove("hidden");
      }
    }

    function changeTheme(theme) {
      switch (theme) {
        case 'default':
          document.body.style.background = 'linear-gradient(#111, #333)';
          break;
        case 'dark':
          document.body.style.background = '#000';
          break;
        case 'neon':
          document.body.style.background = 'linear-gradient(45deg, #0ff, #f0f)';
          break;
        case 'sunset':
          document.body.style.background = 'linear-gradient(to right, #ff5e62, #ff9966)';
          break;
      }
    }

    function showFloatingPoints(value, x, y) {
      const span = document.createElement("span");
      span.className = "float";
      span.style.left = x + 'px';
      span.style.top = y + 'px';
      span.textContent = `+${value}`;
      document.body.appendChild(span);
      setTimeout(() => span.remove(), 1000);
    }

    document.getElementById("clickButton").addEventListener("click", (e) => {
      points += clickPower;
      clickSound.play();
      updateUI();
      checkEasterEgg();
      renderUpgrades();
      saveGame();
      showFloatingPoints(clickPower, e.clientX, e.clientY);
    });

    document.getElementById("upgradeMenuBtn").addEventListener("click", () => {
      upgradesContainer.style.display = upgradesContainer.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") document.getElementById("clickButton").click();
    });

    window.onload = () => {
      loadGame();
      renderUpgrades();
      startTimer();
      applyPassiveIncome();
    }