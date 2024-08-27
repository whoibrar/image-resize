const presets = {"presets":
[
    {"name":"JEE Photograph","type":"photograph","format":["JPG","JPEG"],"fileSize":{"min":10,"max":200,"unit":"kb"},"dimensions":{"width":3.5,"height":4.5,"unit":"cm"}},
    {"name":"JEE Signature","type":"signature","format":["JPG","JPEG"],"fileSize":{"min":4,"max":30,"unit":"kb"},"dimensions":{"width":3.5,"height":1.5,"unit":"cm"}},
    {"name":"NEET Photograph","type":"photograph","format":["JPG","JPEG"],"fileSize":{"min":10,"max":200,"unit":"kb"},"dimensions":{"width":2.5,"height":3.5,"unit":"cm"}},
    {"name":"NEET Signature","type":"signature","format":["JPG","JPEG"],"fileSize":{"min":4,"max":30,"unit":"kb"},"dimensions":{"width":276,"height":118,"unit":"px"}},
    {"name":"PAN CARD Photo","type":"photograph","format":["JPG","JPEG"],"fileSize":{"min":20,"max":50,"unit":"kb"},"dimensions":{"width":2.5,"height":3.5,"unit":"cm"}},
    {"name":"PAN CARD Signature","type":"signature","format":["JPG","JPEG"],"fileSize":{"min":10,"max":10,"unit":"kb"},"dimensions":{"width":355,"height":158,"unit":"px"}},
    {"name":"Driving License Photograph","type":"photograph","format":["JPG","JPEG"],"fileSize":{"min":20,"max":20,"unit":"KB"},"dimensions":{"width":420,"height":525,"unit":"px"}},
    {"name":"Driving License Signature","type":"signature","format":["JPG","JPEG"],"fileSize":{"min":20,"max":20,"unit":"KB"},"dimensions":{"width":256,"height":64,"unit":"px"}}
]};

// Add these variables at the top of your file
let deferredPrompt;
const installButton = document.createElement('button');
installButton.style.display = 'none';
installButton.textContent = 'Install App';
document.body.appendChild(installButton);

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Update UI to notify the user they can add to home screen
  installButton.style.display = 'block';
});

installButton.addEventListener('click', (e) => {
  // Hide our user interface that shows our A2HS button
  installButton.style.display = 'none';
  // Show the prompt
  deferredPrompt.prompt();
  // Wait for the user to respond to the prompt
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
    } else {
      console.log('User dismissed the A2HS prompt');
    }
    deferredPrompt = null;
  });
});


const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const resizeOptionInput = document.getElementById('resizeOptionInput');
const resizeOptionDropdown = document.getElementById('resizeOptionDropdown');
const customSizeInputs = document.getElementById('customSizeInputs');
const customWidth = document.getElementById('customWidth');
const customHeight = document.getElementById('customHeight');
const customMaxSize = document.getElementById('customMaxSize');
const resizeButton = document.getElementById('resizeButton');
const feedback = document.getElementById('feedback');

let imageFile = null;
let selectedPreset = null;

function populateDropdown() {
    resizeOptionDropdown.innerHTML = '';
    presets.presets.forEach(preset => {
        const div = document.createElement('div');
        div.innerHTML = `
            ${preset.name}
            ${preset.type !== 'custom' ? `
                <span class="preset-info"> ${preset.dimensions.width} x ${preset.dimensions.height} ${preset.dimensions.unit} | ${preset.fileSize.min}-${preset.fileSize.max} ${preset.fileSize.unit}
                </span>
            ` : ''}
        `;
        div.addEventListener('click', () => selectOption(preset));
        resizeOptionDropdown.appendChild(div);
    });
}

function selectOption(preset) {
    selectedPreset = preset;
    resizeOptionInput.value = preset.name;
    customSizeInputs.style.display = preset.type === 'custom' ? 'block' : 'none';
    toggleDropdown();
}

function toggleDropdown() {
    resizeOptionDropdown.style.display = resizeOptionDropdown.style.display === 'block' ? 'none' : 'block';
}

resizeOptionInput.addEventListener('focus', () => {
    resizeOptionDropdown.style.display = 'block';
});

resizeOptionInput.addEventListener('blur', (e) => {
    // Delay hiding to allow for option selection
    setTimeout(() => {
        resizeOptionDropdown.style.display = 'none';
    }, 200);
});

resizeOptionInput.addEventListener('input', function() {
    const filter = this.value.toUpperCase();
    const options = resizeOptionDropdown.getElementsByTagName('div');
    let visibleOptions = 0;
    for (let i = 0; i < options.length; i++) {
        const txtValue = options[i].textContent || options[i].innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            options[i].style.display = "";
            visibleOptions++;
        } else {
            options[i].style.display = "none";
        }
    }
    resizeOptionDropdown.style.display = visibleOptions > 0 ? 'block' : 'none';
});

imageUpload.addEventListener('change', (event) => {
    imageFile = event.target.files[0];
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            resizeButton.disabled = false;
        };
        reader.readAsDataURL(imageFile);
    }
});

resizeButton.addEventListener('click', handleResize);

async function handleResize() {
    if (!imageFile) {
        setFeedback("Please select an image to resize.", "error");
        return;
    }

    if (!selectedPreset) {
        setFeedback("Please select a resize option.", "error");
        return;
    }

    let width, height, maxSizeKB;

    if (selectedPreset.type !== 'custom') {
        width = selectedPreset.dimensions.width;
        height = selectedPreset.dimensions.height;
        maxSizeKB = selectedPreset.fileSize.max;

        if (selectedPreset.dimensions.unit === 'cm') {
            // Convert cm to pixels (assuming 96 DPI)
            width = Math.round(width * 37.795275591);
            height = Math.round(height * 37.795275591);
        }
    } else {
        width = parseInt(customWidth.value);
        height = parseInt(customHeight.value);
        maxSizeKB = parseInt(customMaxSize.value);

        if (isNaN(width) || isNaN(height) || isNaN(maxSizeKB)) {
            setFeedback("Please enter valid custom dimensions and max size", "error");
            return;
        }
    }

    resizeButton.disabled = true;
    resizeButton.textContent = 'Resizing...';

    try {
        const resizedImage = await resizeImage(imageFile, width, height, maxSizeKB);
        const url = URL.createObjectURL(resizedImage);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resized_${width}x${height}_${imageFile.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setFeedback(`Image resized successfully. Final size: ${Math.round(resizedImage.size / 1024)}KB`, "success");
    } catch (error) {
        setFeedback(`Error resizing image: ${error.message}`, "error");
    } finally {
        resizeButton.disabled = false;
        resizeButton.textContent = 'Resize and Download';
    }
}

async function resizeImage(file, width, height, maxSizeKB) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            let quality = 1.0;
            const step = 0.05;

            const compressAndCheck = () => {
                canvas.toBlob((blob) => {
                    if (blob.size <= maxSizeKB * 1024 || quality <= 0.1) {
                        resolve(blob);
                    } else {
                        quality -= step;
                        compressAndCheck();
                    }
                }, 'image/jpeg', quality);
            };

            compressAndCheck();
        };
        img.onerror = () => reject(new Error("Error loading image"));
        img.src = URL.createObjectURL(file);
    });
}

function setFeedback(message, type) {
    feedback.textContent = message;
    feedback.className = type;
}

// Initialize
populateDropdown();
