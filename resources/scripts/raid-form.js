const datasets = {
    class: [
        { value: 'death-knight', text: 'Death Knight' },
        { value: 'demon-hunter', text: 'Demon Hunter' },
        { value: 'druid', text: 'Druid' },
        { value: 'evoker', text: 'Evoker' },
        { value: 'hunter', text: 'Hunter' },
        { value: 'mage', text: 'Mage' },
        { value: 'monk', text: 'Monk' },
        { value: 'paladin', text: 'Paladin' },
        { value: 'priest', text: 'Priest' },
        { value: 'rogue', text: 'Rogue' },
        { value: 'shaman', text: 'Shaman' },
        { value: 'warlock', text: 'Warlock' },
        { value: 'warrior', text: 'Warrior' }
    ],

    role: [
        { value: 'melee', text: 'Melee DPS' },
        { value: 'ranged', text: 'Ranged DPS' },
        { value: 'healer', text: 'Healer' },
        { value: 'tank', text: 'Tank' }
    ]
};

const required = {
    inputs: ['character', 'season'],
    main: ['mainClass', 'mainSpec'],
    alt: ['altClass', 'altSpec']
};

// Local raid time
const raidDate = new Date('2026-03-05T01:00:00Z'); // UTC raid time
const weekday = raidDate.toLocaleDateString([], { weekday: 'long' });
const time = raidDate.toLocaleTimeString([], { hour: 'numeric', hour12: true, timeZoneName: 'short' });
document.getElementById('raidtime').textContent = `${weekday} at ${time}`;

// Populate custom selects
document.querySelectorAll('.custom-select').forEach(select => {
    const type = select.dataset.populate;
    const options = datasets[type];
    const ul = select.querySelector('.custom-select__options');
    const csSelected = select.querySelector('.custom-select__selected');
    const csClear = select.querySelector('.custom-select__clear');

    // store placeholder
    csSelected.setAttribute('data-placeholder', csSelected.textContent);

    options.forEach(opt => {
        const li = document.createElement('li');
        li.textContent = opt.text;
        li.dataset.value = opt.value;
        ul.appendChild(li);

        // update visible selector & data-value
        li.addEventListener('click', e => {
            e.stopPropagation();
            csSelected.textContent = opt.text;
            csSelected.classList.remove('placeholder');
            select.dataset.value = opt.value;
            select.classList.add('has-value');
            select.classList.remove('open');
        });
    });

    // toggle dropdown
    select.addEventListener('click', e => {
        e.stopPropagation();
        select.classList.toggle('open');
    });

    // clear selection
    csClear.addEventListener('click', e => {
        e.stopPropagation();
        csSelected.textContent = csSelected.getAttribute('data-placeholder');
        csSelected.classList.add('placeholder');
        select.dataset.value = '';
        select.classList.remove('has-value');
    });

    select.addEventListener('blur', () => select.classList.remove('open'));
});

// Close all dropdowns on outside click
document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select').forEach(s => s.classList.remove('open'));
});

// Checkbox toggle
const checkbox = document.getElementById('raidAlt');
const label = document.querySelector('label[for="raidAlt"]');
const altSelects = document.querySelectorAll('.custom-select[data-group="alt"]');
checkbox.addEventListener('change', () => {
    label.classList.toggle('placeholder', !checkbox.checked);
    // reset the alt fields
    altSelects.forEach(select => {
        const clearBtn = select.querySelector('.custom-select__clear');
        select.classList.toggle('is-disabled', !checkbox.checked);
        if (!checkbox.checked && select.dataset.value) {
            clearBtn.click();
        }
    });
});

const form = document.getElementById('raidform');
const submitBtn = form.querySelector('button');
const formAction = 'https://raid-form.flukegaming57.workers.dev';

// ---------- Permanent listeners for removing u-required ----------
form.querySelectorAll('input').forEach(input => {
    input.addEventListener('focus', () => input.classList.remove('u-required'));
});

form.querySelectorAll('.custom-select').forEach(select => {
    select.addEventListener('focus', () => select.classList.remove('u-required'));
});

// ---------- Form submission ----------
form.addEventListener('submit', async e => {
    e.preventDefault();

    const reqMissing = [];

    // 1️⃣ Check standard inputs
    required.inputs.forEach(name => {
        const el = form.querySelector(`[name="${name}"]`);
        if (!el?.value) {
            reqMissing.push(name);
            el?.classList.add('u-required');
        }
    });

    // 2️⃣ Always required main selects
    required.main.forEach(name => {
        const el = form.querySelector(`[data-name="${name}"]`);
        if (!el?.dataset.value) {
            reqMissing.push(name);
            el?.classList.add('u-required');
        }
    });

    // 3️⃣ Conditionally required alt selects
    const hasAlt = document.getElementById('raidAlt').checked;
    if (hasAlt) {
        required.alt.forEach(name => {
            const el = form.querySelector(`[data-name="${name}"]`);
            if (!el?.dataset.value) {
                reqMissing.push(name);
                el?.classList.add('u-required');
            }
        });
    }

    // 4️⃣ Failed validation
    if (reqMissing.length) {
        console.log('Missing:', reqMissing);
        showToast('Not submitted.', 'error');
        return;
    }

    // 5️⃣ Proceed with form submission (disable fields, send data, etc.)
    const formData = new FormData(form);

    // Custom selects
    form.querySelectorAll('.custom-select').forEach(select => {
        if (select.dataset.value) {
            formData.set(select.dataset.name, select.dataset.value);
        }
    });

    // Disable form
    form.classList.add('is-disabled');
    submitBtn.textContent = 'Submitting...';

    try {
        const jsonData = Object.fromEntries(formData.entries());
        const response = await fetch(formAction, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jsonData)
        });
        const answer = await response.json();

        if (answer.appendStatus === 'success') {
            showToast('Signup success!', 'success');
            submitBtn.textContent = 'Submitted';
        } else {
            showToast('Signup failed.', 'error');
            submitBtn.textContent = 'Submit';
            form.classList.remove('is-disabled');
        }

    } catch (err) {
        console.error(err);
        showToast('Submit failed.', 'error');
        submitBtn.textContent = 'Submit';
        form.classList.remove('is-disabled');
    }
});

function showToast(message, type = 'success', duration = 3000) {
    // clear any existing toasts
    const container = document.getElementById('toast-container');
    container.innerHTML = '';
    // add a new toast
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('show'));

    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}