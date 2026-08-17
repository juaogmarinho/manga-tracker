document.addEventListener('click',event=>{const link=event.target.closest('.nav-link');if(link&&event.target!==link)link.click()});
