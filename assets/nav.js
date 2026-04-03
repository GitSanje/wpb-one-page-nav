


document.addEventListener("DOMContentLoaded", () => {
    

    const TreeState = {
        collapsed: new Set(),// collapsed node ids
        selected: null, // currently selected node id
    }
     let globalParentshortcodes = new Map();

    function setParentChildShortcodes(){
        vc.shortcodes.models.forEach(function(model) {
                const { shortcode, parent_id: parentId, id } = model.attributes;
                if (shortcode === "vc_row") return
                const shortcodeData = {
                    id: id,
                    shortcode
                 };

                 if(!globalParentshortcodes.has(parentId)){
                    globalParentshortcodes.set(parentId, []);
                 }
           globalParentshortcodes.get(parentId).push(shortcodeData);

        })
    }

   
    
   
    if (typeof vc !== 'undefined' && vc.shortcodes) {
        function updateNavItems() {
             setParentChildShortcodes();
          console.log(globalParentshortcodes, "global");
            if (!vc.shortcodes) return;
             
            vc.shortcodes.models.forEach(function(model) {
              
                const shortcode = model.attributes.shortcode;
                const params    = model.attributes.params || {};
                const rowId = model.attributes.id;

                if (shortcode === 'vc_row' && params.show_in_nav === 'yes') {
                    const row = document.querySelector(`[data-model-id="${rowId}"]`);                  
                     row.dataset.navLabel = params.nav_label;
                    row.dataset.navId = "#"+params.nav_id;
                    console.log("Nav Item:", params.nav_label, params.nav_id,rowId);
                 
                }
            });

         

        }
        setTimeout(function() {
            updateNavItems();
        }, 2000);

        // // Also listen to events
        // vc.events.on('shortcodes:add shortcodes:updated shortcodes:ready', updateNavItems);

         console.log("WPBakery backend detected", vc.shortcodes.models,vc);
       
      
    }

       
      
    
    
    function removeAllHighlights(nav){
         const sections = document.querySelectorAll("[data-nav-label]");
         sections.forEach( section => {
            section.classList.remove("add-active-highlight")
         })
         nav.querySelectorAll("a").forEach( a => a.classList.remove("active"))



    }


    function createTreeNode(model){
           const shortcode = model.shortcode;
        const modelId = model.id;

        const isCollapsed = TreeState.collapsed.has(model.id);
      

      
          // Main node container
        const node = document.createElement("div");
        node.classList.add("tree-node");

        // Label (text only)
        const label = document.createElement("div");
        label.classList.add("tree-label");
        label.innerText = shortcode;
        node.dataset.navModelId = modelId;

        // Toggle button for children
        const toogleBtn = document.createElement("button");
        toogleBtn.classList.add("toggle-btn");
        toogleBtn.textContent =  "▶" ;// "▼";

        if (TreeState.selected === model.id) {
            node.classList.add("active-node");
        }
        

          if(isCollapsed){
            childrenContainer.style.display = "none";
         
        } 
        label.appendChild(toogleBtn);
        node.appendChild(label);
        
        // Children container

        const children = globalParentshortcodes.get(modelId)
        if (children && children.length){
              const childrenContainer = document.createElement("div");
            childrenContainer.classList.add("tree-children");
            children.forEach(child => {
                const childNode = createTreeNode(child);
                  if (childNode) childrenContainer.appendChild(childNode);
            })
            node.appendChild(childrenContainer);
        }

        return node;

    }
    function buildNavbar() {
        const sections = document.querySelectorAll("[data-nav-label]");
        if (!sections.length) return;

        // Build navbar container
        const nav = document.createElement("div");
        nav.classList.add("custom-navbar");
        const header = document.createElement("div");
            header.className = "navbar-header";
            header.innerHTML = `
                <h3>📑 Page Navigation</h3>
                <div class="navbar-controls">
                    <button class="nav-control-btn collapse-all">📁</button>
                    <button class="nav-control-btn expand-all">📂</button>
                </div>
            `;
        nav.insertBefore(header, nav.firstChild);

        sections.forEach( section => {
            const label = section.dataset.navLabel;
            const id = section.dataset.navId;
            const modelId = section.dataset.modelId

            if (!label || !id) return;
            const link = document.createElement("a");
            link.href =  modelId;

            const imageTextContainer = document.createElement("div");
            imageTextContainer.classList.add("image-text-container");
            const img = document.createElement("img");
            img.src = wpbOnePageNav.plugin_url + 'assets/imgs/element-icon-row.svg';
            img.alt = label;
            img.classList.add("nav-icon");

             imageTextContainer.appendChild(img);
             const textSpan = document.createElement("span");
              textSpan.innerHTML = label;
             imageTextContainer.appendChild(textSpan);

             const toogleSpan = document.createElement("span");
             toogleSpan.classList.add("toggle-btn");
             toogleSpan.textContent = "▶";
              link.appendChild(imageTextContainer);
             link.appendChild(toogleSpan);
            

             const container = document.createElement("div")
             container.classList.add("tree-node")
             container.dataset.navModelId = modelId

         
             const rootItems = globalParentshortcodes.get(modelId)
             rootItems.forEach(model => {
                const node = createTreeNode(model);
                if (node) container.appendChild(node);
            });
            
         
            nav.appendChild(link);
            nav.appendChild(container);
        })

        document.body.appendChild(nav);
         

        // Smooth scroll
        nav.querySelectorAll("a").forEach( a => {
            a.addEventListener("click", e => {
                e.preventDefault();
                const rowId = a.getAttribute("href")
                const target = document.querySelector(`[data-model-id="${rowId}"]`);
              
              
                if (!target) return;
                removeAllHighlights(nav);
                target.classList.add("add-active-highlight");
                 a.classList.add("active");
                 console.log(`added target highlight and a ${target}, `);
                 
                window.scrollTo({
                    top: target.offsetTop - 60,
                    behavior: "smooth"
                });
            })
        })


        function toggleAllNestedNodes(container, isActive) {
            if (!container) return;
            
            // Find all tree nodes within the container
            const allTreeNodes = container.querySelectorAll('.tree-node');
            
            allTreeNodes.forEach(node => {
                if (isActive) {
                    node.classList.add('active-node');
                } else {
                    node.classList.remove('active-node');
                }
            });
        }


        // Collapse/Expand logic
        nav.querySelectorAll("a").forEach( item => {
            const toggleBtn = item.querySelector(".toggle-btn");
            const navModelId = item.getAttribute('href')
            const treeChild = document.querySelector(`[data-nav-model-id="${navModelId}"`)

            
            
            let isCollapsed = false;
            if (toggleBtn) {
                toggleBtn.addEventListener("click", e => {
                    e.preventDefault();
                        isCollapsed = !isCollapsed;

                        toggleAllNestedNodes(treeChild,isCollapsed)
                       
                
                    // const isCollapsed = childrenContainer.style.display === "none";
                    // childrenContainer.style.display = isCollapsed ? "block" : "none";
                    toggleBtn.textContent = isCollapsed ? "▼" : "▶";
                })
            }
        
        })

        // Scroll spy
        window.addEventListener("scroll", ()=> {
            let current = "";
            sections.forEach(section => {
                if (window.scrollY >= section.offsetTop - 80) {
                    current = section.id;
                }
            });


            nav.querySelectorAll("a").forEach(a => {
                a.classList.remove("active");
                if (a.getAttribute("href") ===  current) {
                    a.classList.add("active");
                }
            })
        })

    }
   setTimeout(buildNavbar, 2500);
     

})
