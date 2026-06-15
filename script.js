// === State Management ===
let state = {
  currentSectionIndex: 0,
  chickens: [],          // Initial 10 chickens
  fitnessSorted: [],     // Chickens sorted by fitness
  breeders: {
    male: null,          // 1 Jantan terbaik
    females: []          // 4 Betina terbaik
  },
  offspring: [],         // 4 offspring from crossover
  mutatedOffspring: [],  // Offspring after mutation check
  hasMutationOccurred: false,
  numMutated: 0
};

// Names for our chickens
const CHICKEN_NAMES = ["Ayam A", "Ayam B", "Ayam C", "Ayam D", "Ayam E", "Ayam F", "Ayam G", "Ayam H", "Ayam I", "Ayam J"];

// === Helper Functions ===

// Generate SVG illustration for chickens based on gender and seed
function getChickenSVG(gender, colorSeed, isHero = false) {
  const colors = ['#FFEAA7', '#FDCB6E', '#FFE066', '#FFE5A3', '#FFF2CC'];
  const bodyColor = colors[colorSeed % colors.length];
  const wingColor = colorSeed % 2 === 0 ? '#FFD033' : '#FFB142';
  const tailColor = '#E17055';
  
  const width = isHero ? 160 : 70;
  const height = isHero ? 160 : 70;
  
  if (gender === 'Jantan') {
    // Rooster (Jantan) SVG with large comb and wattle
    return `
      <svg class="chicken-svg" viewBox="0 0 100 100" width="${width}" height="${height}">
        <!-- Tail feathers -->
        <path d="M 22 55 C 8 35, 12 18, 28 28 C 18 8, 5 13, 12 38 Z" fill="${tailColor}" />
        <!-- Body -->
        <circle cx="50" cy="55" r="30" fill="${bodyColor}" />
        <!-- Wing -->
        <path d="M 35 55 C 35 46, 48 46, 50 52 C 52 58, 42 60, 35 55 Z" fill="${wingColor}" />
        <!-- Large Comb (Jengger) -->
        <path d="M 46 26 C 46 16, 55 13, 57 21 C 62 11, 68 16, 65 25 Z" fill="#D63031" />
        <!-- Large Wattle (Gelambir) -->
        <path d="M 74 55 C 74 61, 69 64, 67 55 Z" fill="#D63031" />
        <!-- Beak -->
        <polygon points="70,45 82,49 70,53" fill="#FF7675" />
        <!-- Eye -->
        <circle cx="60" cy="40" r="4" fill="#2C3E50" />
        <circle cx="61.5" cy="38.5" r="1.2" fill="#FFFFFF" />
        <!-- Feet -->
        <path d="M 42 85 L 42 93 M 42 93 L 37 93 M 42 93 L 47 93" stroke="#E17055" stroke-width="3" stroke-linecap="round" />
        <path d="M 58 85 L 58 93 M 58 93 L 53 93 M 58 93 L 63 93" stroke="#E17055" stroke-width="3" stroke-linecap="round" />
      </svg>
    `;
  } else {
    // Hen (Betina) SVG with small comb and rounder body
    return `
      <svg class="chicken-svg" viewBox="0 0 100 100" width="${width}" height="${height}">
        <!-- Small Tail -->
        <path d="M 26 52 C 18 42, 20 32, 28 38 Z" fill="${tailColor}" />
        <!-- Body -->
        <circle cx="50" cy="56" r="28" fill="${bodyColor}" />
        <!-- Wing -->
        <path d="M 36 56 C 36 48, 46 48, 48 53 C 50 58, 42 60, 36 56 Z" fill="${wingColor}" />
        <!-- Small Comb -->
        <path d="M 48 29 C 48 24, 52 23, 53 27 C 56 22, 59 24, 58 29 Z" fill="#D63031" />
        <!-- Beak -->
        <polygon points="68,46 78,49 68,52" fill="#FF7675" />
        <!-- Eye -->
        <circle cx="58" cy="41" r="3.5" fill="#2C3E50" />
        <circle cx="59" cy="40" r="1" fill="#FFFFFF" />
        <!-- Feet -->
        <path d="M 43 84 L 43 91 M 43 91 L 39 91 M 43 91 L 47 91" stroke="#E17055" stroke-width="3" stroke-linecap="round" />
        <path d="M 57 84 L 57 91 M 57 91 L 53 91 M 57 91 L 61 91" stroke="#E17055" stroke-width="3" stroke-linecap="round" />
      </svg>
    `;
  }
}

// Fisher-Yates Shuffle algorithm
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Round to 2 decimals
function roundToTwo(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

// === Genetic Algorithm Operations ===

// Step 1: Initialize population (4 Jantan, 6 Betina)
function initializePopulation() {
  const genders = ["Jantan", "Jantan", "Jantan", "Jantan", "Betina", "Betina", "Betina", "Betina", "Betina", "Betina"];
  shuffle(genders);
  
  state.chickens = CHICKEN_NAMES.map((name, index) => {
    return {
      id: index,
      name: name,
      gender: genders[index],
      // Genes will be generated next step
      weight: 0,
      health: 0,
      eggs: 0,
      fitness: 0
    };
  });
}

// Step 2: Generate chromosome genes
function generateChromosomes() {
  state.chickens.forEach(chicken => {
    // Berat diacak antara 1.5 - 3.5 kg
    chicken.weight = roundToTwo(Math.random() * 2 + 1.5);
    // Tahan penyakit diacak antara 60 - 100
    chicken.health = Math.floor(Math.random() * 41) + 60;
    // Jumlah telur untuk betina (150-300), jantan isi 0
    if (chicken.gender === "Betina") {
      chicken.eggs = Math.floor(Math.random() * 151) + 150;
    } else {
      chicken.eggs = 0; // Treated as 0 for formulas
    }
  });
}

// Step 3: Calculate fitness scores and sort descending
function evaluateFitness() {
  state.chickens.forEach(chicken => {
    // Fitness = Berat * 30 + Tahan Penyakit * 0.5 + Jumlah Telur * 0.2
    // Jantan eggs is already set to 0, which complies with "jika jantan, jumlah telur dianggap 0"
    chicken.fitness = roundToTwo(
      (chicken.weight * 30) + 
      (chicken.health * 0.5) + 
      (chicken.eggs * 0.2)
    );
  });
  
  // Create sorted copy
  state.fitnessSorted = [...state.chickens].sort((a, b) => b.fitness - a.fitness);
}

// Step 4: Select parents (1 best Jantan, 4 best Betina)
function selectBreeders() {
  const males = state.fitnessSorted.filter(c => c.gender === "Jantan");
  const females = state.fitnessSorted.filter(c => c.gender === "Betina");
  
  state.breeders.male = males[0];
  state.breeders.females = females.slice(0, 4);
}

// Step 5: Crossover (Persilangan) to produce 4 offspring
function performCrossover() {
  const father = state.breeders.male;
  state.offspring = [];
  
  state.breeders.females.forEach((mother, index) => {
    // Anak diperoleh dari rata-rata induknya
    const weight = roundToTwo((father.weight + mother.weight) / 2);
    const health = Math.round((father.health + mother.health) / 2);
    // Since father's egg capability is considered 0 for laying, but genetics-wise
    // let's average: (Father's egg gene [0] + Mother's eggs) / 2 = Mother's eggs / 2.
    // Or we can assume rooster carries egg gene equivalent to 0. 
    // Let's do (0 + mother.eggs) / 2 as per standard average of parent attributes.
    const eggs = Math.round((0 + mother.eggs) / 2);
    
    state.offspring.push({
      name: `Anak Ayam ${index + 1}`,
      father: father.name,
      mother: mother.name,
      weight: weight,
      health: health,
      eggs: eggs,
      mutationChance: 0.3
    });
  });
}

// Step 6: Mutate offspring (30% chance)
function performMutation() {
  state.mutatedOffspring = [];
  state.numMutated = 0;
  
  state.offspring.forEach(child => {
    const isMutated = Math.random() < child.mutationChance;
    let mutatedTrait = "Tidak ada mutasi";
    let traitEffect = "";
    
    // Create copy for mutation
    let childCopy = { ...child };
    
    if (isMutated) {
      state.numMutated++;
      const mutationType = Math.floor(Math.random() * 3);
      
      if (mutationType === 0) {
        // Lebih tahan penyakit (+15)
        const oldHealth = childCopy.health;
        childCopy.health = Math.min(100, childCopy.health + 15);
        mutatedTrait = "Lebih tahan penyakit";
        traitEffect = `🛡️ Tahan Penyakit: +${childCopy.health - oldHealth}%`;
      } else if (mutationType === 1) {
        // Pertumbuhan lebih cepat (+0.5 kg)
        childCopy.weight = roundToTwo(childCopy.weight + 0.5);
        mutatedTrait = "Pertumbuhan lebih cepat";
        traitEffect = "⚖️ Berat Badan: +0.5 kg";
      } else {
        // Produksi telur meningkat (+40)
        childCopy.eggs = childCopy.eggs + 40;
        mutatedTrait = "Produksi telur meningkat";
        traitEffect = "🥚 Jumlah Telur: +40 butir";
      }
    }
    
    state.mutatedOffspring.push({
      child: childCopy,
      isMutated: isMutated,
      mutatedTrait: mutatedTrait,
      traitEffect: traitEffect
    });
  });
  
  state.hasMutationOccurred = state.numMutated > 0;
}

// === DOM Rendering & Navigation ===

// Main screen controller
function goToSection(index) {
  state.currentSectionIndex = index;
  
  // Hide all sections
  document.querySelectorAll(".sim-section").forEach(sec => sec.classList.remove("active"));
  
  // Show target section
  const targetSec = document.getElementById(`section-${index}`);
  if (targetSec) targetSec.classList.add("active");
  
  // Navigation elements visibility
  const navFooter = document.getElementById("navigation-footer");
  const progContainer = document.getElementById("progress-container");
  
  if (index === 0) {
    navFooter.style.display = "none";
    progContainer.style.display = "none";
  } else {
    navFooter.style.display = "flex";
    progContainer.style.display = "block";
    updateProgressBar(index);
  }
  
  // Trigger specific page data render
  renderSectionData(index);
  
  // Scroll to top of the content container
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update progress path at the top
function updateProgressBar(index) {
  const eggs = document.querySelectorAll(".step-egg");
  const fillWidth = ((index) / 7) * 100;
  document.getElementById("progress-fill").style.width = `${fillWidth}%`;
  
  eggs.forEach((egg, idx) => {
    egg.classList.remove("active", "completed");
    
    const eggVisual = egg.querySelector(".egg-visual");
    
    if (idx === index) {
      egg.classList.add("active");
      if (idx > 0 && idx < 7) {
        eggVisual.textContent = "🥚"; // Unhatched for future
      } else if (idx === 7) {
        eggVisual.textContent = "🐣"; // Hatching at final
      }
    } else if (idx < index) {
      egg.classList.add("completed");
      if (idx > 0) {
        eggVisual.textContent = "🐥"; // Completed eggs hatch into chicks!
      }
    } else {
      if (idx === 7) {
        eggVisual.textContent = "🥚"; // Reset final egg if going backward
      }
    }
  });
}

// Render simulation table or grid contents dynamically
function renderSectionData(index) {
  switch (index) {
    case 1: // Populasi
      renderPopulasiTable();
      break;
    case 2: // Kromosom
      renderKromosomTable();
      break;
    case 3: // Fitness
      renderFitnessTable();
      break;
    case 4: // Seleksi
      renderSeleksiCards();
      break;
    case 5: // Crossover
      renderCrossoverTable();
      break;
    case 6: // Mutasi
      renderMutasiTable();
      break;
    case 7: // Hasil Akhir
      renderHasilAkhir();
      break;
  }
}

// Render Populasi Table (Step 1)
function renderPopulasiTable() {
  const tbody = document.querySelector("#table-populasi tbody");
  tbody.innerHTML = "";
  
  state.chickens.forEach((chicken, idx) => {
    const tr = document.createElement("tr");
    const genderClass = chicken.gender === "Jantan" ? "gender-jantan" : "gender-betina";
    
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td class="font-bold">${chicken.name}</td>
      <td>
        <span class="chicken-gender-badge ${genderClass}">
          ${chicken.gender === "Jantan" ? "♂️ Jantan" : "♀️ Betina"}
        </span>
      </td>
      <td class="chicken-card-icon">${getChickenSVG(chicken.gender, chicken.id)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Render Kromosom Table (Step 2)
function renderKromosomTable() {
  const tbody = document.querySelector("#table-kromosom tbody");
  tbody.innerHTML = "";
  
  state.chickens.forEach((chicken) => {
    const tr = document.createElement("tr");
    const eggDisplay = chicken.gender === "Betina" ? `${chicken.eggs} butir` : "-";
    
    tr.innerHTML = `
      <td class="font-bold">${chicken.name}</td>
      <td><span class="value-weight">${chicken.weight} kg</span></td>
      <td><span class="value-health">${chicken.health}%</span></td>
      <td><span class="value-eggs">${eggDisplay}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// Render Fitness Table (Step 3)
function renderFitnessTable() {
  const tbody = document.querySelector("#table-fitness tbody");
  tbody.innerHTML = "";
  
  state.fitnessSorted.forEach((chicken, idx) => {
    const tr = document.createElement("tr");
    const eggVal = chicken.gender === "Betina" ? `${chicken.eggs}` : "0";
    const detailText = `⚖️ ${chicken.weight}kg | 🛡️ ${chicken.health}% | 🥚 ${eggVal}`;
    const rankLabel = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`;
    
    tr.innerHTML = `
      <td class="font-bold text-center">${rankLabel}</td>
      <td class="font-bold">${chicken.name}</td>
      <td>
        <span class="chicken-gender-badge ${chicken.gender === "Jantan" ? 'gender-jantan' : 'gender-betina'}">
          ${chicken.gender}
        </span>
      </td>
      <td style="font-size: 0.85rem; color: var(--text-muted);">${detailText}</td>
      <td><span class="value-fitness">${chicken.fitness}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// Render Seleksi Cards (Step 4)
function renderSeleksiCards() {
  // Populate the table
  const tbody = document.querySelector("#table-seleksi tbody");
  tbody.innerHTML = "";
  
  // Male
  const male = state.breeders.male;
  let tr = document.createElement("tr");
  tr.className = "highlight-male";
  tr.innerHTML = `
    <td class="font-bold">${male.name}</td>
    <td><span class="chicken-gender-badge gender-jantan">♂️ Jantan</span></td>
    <td><span class="value-fitness">${male.fitness}</span></td>
  `;
  tbody.appendChild(tr);
  
  // Females
  state.breeders.females.forEach(female => {
    tr = document.createElement("tr");
    tr.className = "highlight-female";
    tr.innerHTML = `
      <td class="font-bold">${female.name}</td>
      <td><span class="chicken-gender-badge gender-betina">♀️ Betina</span></td>
      <td><span class="value-fitness">${female.fitness}</span></td>
    `;
    tbody.appendChild(tr);
  });

  // Populate cards
  const container = document.getElementById("breeder-cards-container");
  container.innerHTML = "";
  
  // Show Male Breeder
  const maleCard = document.createElement("div");
  maleCard.className = "chicken-card selected-highlight breeder-male";
  maleCard.innerHTML = `
    <div class="chicken-card-icon">${getChickenSVG(male.gender, male.id)}</div>
    <div class="chicken-name">${male.name} (Ayah)</div>
    <span class="chicken-gender-badge gender-jantan">♂️ Jantan</span>
    <div style="margin-top: 10px; font-size: 0.85rem;">
      <div>Skor Fitness: <strong class="value-fitness">${male.fitness}</strong></div>
      <div style="color: var(--text-muted);">⚖️ ${male.weight} kg | 🛡️ ${male.health}%</div>
    </div>
  `;
  container.appendChild(maleCard);
  
  // Show Female Breeders
  state.breeders.females.forEach((female, idx) => {
    const femCard = document.createElement("div");
    femCard.className = "chicken-card selected-highlight breeder-female";
    femCard.innerHTML = `
      <div class="chicken-card-icon">${getChickenSVG(female.gender, female.id)}</div>
      <div class="chicken-name">${female.name} (Ibu ${idx + 1})</div>
      <span class="chicken-gender-badge gender-betina">♀️ Betina</span>
      <div style="margin-top: 10px; font-size: 0.85rem;">
        <div>Skor Fitness: <strong class="value-fitness">${female.fitness}</strong></div>
        <div style="color: var(--text-muted);">⚖️ ${female.weight} kg | 🛡️ ${female.health}% | 🥚 ${female.eggs}</div>
      </div>
    `;
    container.appendChild(femCard);
  });
}

// Render Crossover Table (Step 5)
function renderCrossoverTable() {
  const tbody = document.querySelector("#table-crossover tbody");
  tbody.innerHTML = "";
  
  state.offspring.forEach((child, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="font-bold">${child.name}</td>
      <td style="font-size: 0.85rem; color: var(--text-muted);">${child.father} × ${child.mother}</td>
      <td><span class="value-weight">${child.weight} kg</span></td>
      <td><span class="value-health">${child.health}%</span></td>
      <td><span class="value-eggs">${child.eggs} butir</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// Render Mutasi Table (Step 6)
function renderMutasiTable() {
  const tbody = document.querySelector("#table-mutasi tbody");
  tbody.innerHTML = "";
  
  state.mutatedOffspring.forEach((item) => {
    const tr = document.createElement("tr");
    
    let traitText = "";
    if (item.isMutated) {
      tr.classList.add("highlight-row");
      traitText = `<span class="mutation-badge mutated">💥 Bermutasi!</span> <strong style="color: var(--danger-color);">${item.mutatedTrait}</strong> (${item.traitEffect})`;
    } else {
      traitText = `Tidak ada mutasi`;
    }
    
    tr.innerHTML = `
      <td class="font-bold">${item.child.name}</td>
      <td>${traitText}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Render Hasil Akhir (Step 7)
function renderHasilAkhir() {
  // Update stats
  document.getElementById("sum-pop-awal").textContent = `${state.chickens.length} Ayam`;
  document.getElementById("sum-induk").textContent = `5 Ayam (1♂️ + 4♀️)`;
  document.getElementById("sum-crossover").textContent = `${state.offspring.length} Ayam`;
  
  const mutasiText = state.hasMutationOccurred 
    ? `Ya (${state.numMutated} Anak)` 
    : "Tidak";
  document.getElementById("sum-mutasi").textContent = mutasiText;
  
  // Calculate averages for comparison
  // Initial Population averages
  const avgWeightInitial = state.chickens.reduce((acc, c) => acc + c.weight, 0) / state.chickens.length;
  const avgHealthInitial = state.chickens.reduce((acc, c) => acc + c.health, 0) / state.chickens.length;
  // Eggs average only for females
  const initialFemales = state.chickens.filter(c => c.gender === "Betina");
  const avgEggsInitial = initialFemales.reduce((acc, c) => acc + c.eggs, 0) / initialFemales.length;
  
  // New Population (Offspring after mutation) averages
  const avgWeightNew = state.mutatedOffspring.reduce((acc, item) => acc + item.child.weight, 0) / state.mutatedOffspring.length;
  const avgHealthNew = state.mutatedOffspring.reduce((acc, item) => acc + item.child.health, 0) / state.mutatedOffspring.length;
  const avgEggsNew = state.mutatedOffspring.reduce((acc, item) => acc + item.child.eggs, 0) / state.mutatedOffspring.length;
  
  // Scale bar charts relative to max possible values (weight: 4kg, health: 100%, eggs: 350)
  const weightMax = 4.0;
  const healthMax = 100.0;
  const eggsMax = 350.0;
  
  const wInitialPct = (avgWeightInitial / weightMax) * 100;
  const wNewPct = (avgWeightNew / weightMax) * 100;
  
  const hInitialPct = (avgHealthInitial / healthMax) * 100;
  const hNewPct = (avgHealthNew / healthMax) * 100;
  
  const eInitialPct = (avgEggsInitial / eggsMax) * 100;
  const eNewPct = (avgEggsNew / eggsMax) * 100;
  
  // Set width and text on bars
  const barWBefore = document.getElementById("bar-weight-before");
  const barWAfter = document.getElementById("bar-weight-after");
  barWBefore.style.width = `${wInitialPct}%`;
  barWBefore.innerHTML = `<span class="bar-text">Awal: ${roundToTwo(avgWeightInitial)} kg</span>`;
  barWAfter.style.width = `${wNewPct}%`;
  barWAfter.innerHTML = `<span class="bar-text">Baru: ${roundToTwo(avgWeightNew)} kg</span>`;
  
  const barHBefore = document.getElementById("bar-health-before");
  const barHAfter = document.getElementById("bar-health-after");
  barHBefore.style.width = `${hInitialPct}%`;
  barHBefore.innerHTML = `<span class="bar-text">Awal: ${Math.round(avgHealthInitial)}%</span>`;
  barHAfter.style.width = `${hNewPct}%`;
  barHAfter.innerHTML = `<span class="bar-text">Baru: ${Math.round(avgHealthNew)}%</span>`;
  
  const barEBefore = document.getElementById("bar-eggs-before");
  const barEAfter = document.getElementById("bar-eggs-after");
  barEBefore.style.width = `${eInitialPct}%`;
  barEBefore.innerHTML = `<span class="bar-text">Awal: ${Math.round(avgEggsInitial)} butir</span>`;
  barEAfter.style.width = `${eNewPct}%`;
  barEAfter.innerHTML = `<span class="bar-text">Baru: ${Math.round(avgEggsNew)} butir</span>`;
}

// Resets state and re-randomizes variables
function resetSimulation() {
  initializePopulation();
  generateChromosomes();
  evaluateFitness();
  selectBreeders();
  performCrossover();
  performMutation();
  goToSection(0);
}

// Run full pre-computations on load, so data is consistent backwards/forwards
function runPrecomputations() {
  initializePopulation();
  generateChromosomes();
  evaluateFitness();
  selectBreeders();
  performCrossover();
  performMutation();
}

// === Event Listeners ===
document.addEventListener("DOMContentLoaded", () => {
  // Initialize dataset
  runPrecomputations();
  
  // Start Button Click
  document.getElementById("btn-start").addEventListener("click", () => {
    goToSection(1);
  });
  
  // Back Button Click
  document.getElementById("btn-back").addEventListener("click", () => {
    if (state.currentSectionIndex > 1) {
      goToSection(state.currentSectionIndex - 1);
    } else if (state.currentSectionIndex === 1) {
      goToSection(0);
    }
  });
  
  // Next Button Click
  document.getElementById("btn-next").addEventListener("click", () => {
    if (state.currentSectionIndex < 7) {
      goToSection(state.currentSectionIndex + 1);
    }
  });
  
  // Reset Button Click
  document.getElementById("btn-reset").addEventListener("click", () => {
    resetSimulation();
  });
  
  // Make progress bar steps clickable (only for already visited or computed pages)
  document.querySelectorAll(".step-egg").forEach((egg) => {
    egg.addEventListener("click", () => {
      const stepIdx = parseInt(egg.getAttribute("data-step"));
      goToSection(stepIdx);
    });
  });
});
