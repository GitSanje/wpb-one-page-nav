
    /*
       ============================================
       DATA LAYER (Tree Builder)
       ============================================
       */

 class ShortCodeTree {

        constructor(vc) {
            this.vc = vc;

            this.map = new Map(); // Stores parent -> childrens

        }

        build() {
            this.map.clear();
            if (!this.vc.shortcodes) return;

            this.vc.shortcodes.models.forEach(model => {

                const { shortcode, parent_id: parentId, id, params } = model.attributes;

                if (shortcode === 'vc_row' && params.show_in_nav === 'yes') {
                    const row = document.querySelector(`[data-model-id="${id}"]`);
                    // Set Row label attribute in row div dataset              
                    row.dataset.navLabel = params.nav_label;
                    return
                }

                if (!this.map.has(parentId)) {
                    this.map.set(parentId, []);
                }
                this.map.get(parentId).push({
                    id,
                    shortcode
                })

            })

            console.log("parent => children", this.map);
            
        }

        getChildren(parentId) {
            return this.map.get(parentId) || [];
        }
    }




    /*
       ============================================
       NAVBAR (UI + CONTROLLER)
       ============================================
       */
class Navbar {

        constructor(tree,element_type="vc_row") {
            this.tree = tree;
            this.nav = document.createElement("div");
            this.nav.className = "opn-custom-navbar";
            this.sections = [];
            this.isClickScrolling = false;
            this.element_type= element_type


            

        }
        init() {
            this.collectSections();
            if (!this.sections.length) return;
            this.buildNavbar();
            this.attachEvents();

        }

        collectSections() {
            this.sections = Array.from(
                document.querySelectorAll(`[data-element_type="${this.element_type}"]`)
            );
        }

        buildNavbar() {

            this.nav.innerHTML = "";
            // Header
            const header = document.createElement("div");
            header.className = "opn-navbar-header";
            header.innerHTML = `
                <h3>📑 Page Navigation</h3>
                <div class="navbar-controls">
                    <button class="opn-nav-control-btn opn-collapse-all" title="Collapse All">📁</button>

                </div>
            `;

            this.nav.appendChild(header);

            this.sections.forEach(section => {
                const label = section.dataset.navLabel || "vc_row";
                const modelId = section.dataset.modelId
                if (!label || !modelId) return;
                // Navbar link item
                const link = document.createElement("a");
                link.href = modelId;
                //Image + label
                const imageTextContainer = document.createElement("div");
                imageTextContainer.classList.add("opn-image-text-container");
                const img = document.createElement("img");
                img.src = wpbOnePageNav.plugin_url + 'assets/imgs/element-icon-row.svg';
                img.alt = label;
                img.classList.add("opn-nav-icon");

                // Label
                const textSpan = document.createElement("span");
                textSpan.textContent = label;

                imageTextContainer.appendChild(img);
                imageTextContainer.appendChild(textSpan);

                // Toggle btn for expand/collapse
                const toogleSpan = document.createElement("span");
                toogleSpan.classList.add("opn-toggle-btn");
                toogleSpan.textContent = "▶";
                link.appendChild(imageTextContainer);
                link.appendChild(toogleSpan);

                //Main child container
                const treeContainer = this.buildTree(modelId);

                this.nav.appendChild(link);
                this.nav.appendChild(treeContainer);
            })

            document.body.appendChild(this.nav);

        }

        buildTree(parentId) {

            const container = document.createElement("div");
            container.classList.add('opn-tree-children')
            container.dataset.navModelId = parentId;

            const children = this.tree.getChildren(parentId);
            children.forEach(child => {

                const node = document.createElement("div");
                node.classList.add("opn-tree-node");
                node.dataset.navModelId = child.id;
                node.setAttribute("draggable", true);

                const label = document.createElement("div");
                label.className = "opn-tree-label";
                label.textContent = child.shortcode;

                // Toggle button for children
                // const toogleBtn = document.createElement("button");
                // toogleBtn.classList.add("toggle-btn");
                // toogleBtn.textContent = "▶";//

                // label.appendChild(toggle);
                node.appendChild(label);

                const childTree = this.buildTree(child.id);
                if (childTree.childNodes.length) {
                    node.appendChild(childTree);
                }

                // add this child 
                container.appendChild(node);

            });
            return container

        }
        attachEvents() {
            // CLICK NAVIGATION (event delegation)
            this.nav.addEventListener("click", (e) => {

                const link = e.target.closest("a");
                if (!link) return;
                e.preventDefault();

                const modelId = link.getAttribute("href");
                const target = document.querySelector(
                    `[data-model-id="${modelId}"]`
                );
                if (!target) return;

                // Remove all highlights
                this.removeAllHighlights();
                target.classList.add("add-active-highlight");
                link.classList.add("active");

                window.scrollTo({
                    top: target.offsetTop - 60,
                    behavior: "smooth"
                });


            })

            // Collapse/Expand logic
            this.nav.querySelectorAll("a").forEach(item => {
                const toggleBtn = item.querySelector(".opn-toggle-btn");
                const navModelId = item.getAttribute('href')
                const treeChild = document.querySelector(`[data-nav-model-id="${navModelId}"`)
                
                let isCollapsed = false;
                if (toggleBtn) {
                    toggleBtn.addEventListener("click", e => {
                        e.preventDefault();
                        isCollapsed = !isCollapsed;
                        this.toggleAllNestedNodes(treeChild, isCollapsed)
                        treeChild.classList.toggle("active-node", isCollapsed);
                        toggleBtn.textContent = isCollapsed ? "▼" : "▶";
                    })
                }
            })

            //Collaspe All
            this.nav.querySelector(".opn-collapse-all")
                .addEventListener("click", () => {
                    this.collapseAll();
                });

            //Update when click on vc_row
            this.sections.forEach(section => {
                section.addEventListener('click', () => {
                    const modelId = section.dataset.modelId
                    const navItem = this.nav.querySelector(`a[href="${modelId}"]`)
                    this.removeAllHighlights();
                    section.classList.add("add-active-highlight");
                   if (navItem) {
                        navItem.classList.add("active");
                    }
                })
            })

  



        }

        removeAllHighlights() {
            this.sections.forEach(section => {
                section.classList.remove("add-active-highlight")
            })
            this.nav.querySelectorAll("a").forEach(a => a.classList.remove("active"))
        }
        clearActive() {
            this.nav.querySelectorAll("a").forEach(a => {
                a.classList.remove("active");
            });
        }

        collapseAll(){
            this.nav.querySelectorAll(".opn-tree-children").forEach(el => {
                el.classList.remove('active-node')
            });
        }

        toggleAllNestedNodes(container, isActive) {
            if (!container) return;

            // Find all tree nodes within the container
            const allTreeNodes = container.querySelectorAll('.opn-tree-children');
            allTreeNodes.forEach(node => {
                if (isActive) {
                    node.classList.add('active-node');
                } else {
                    node.classList.remove('active-node');
                }
            });
        }

    }




    /*
       ============================================
       DRAG AND DROP MANAGER
       ============================================
       */


const DROP_RULES = {
    vc_row: {
        parents: [null], // only root
        children: ["vc_column", "vc_column_inner"]
    },
    vc_column: {
        parents: ["vc_row"],
        children: ["*"] // allow all elements inside
    },
    vc_column_inner: {
        parents: ["vc_column"],
        children: ["*"]
    },
    "*": {
        parents: ["vc_column", "vc_column_inner"],
        children: []
    }
};

class DragDropManager {
       
    constructor(vc,tree, navbar){
        this.vc = vc;
        this.tree = tree
        this.navbar = navbar.nav
        
        this.draggedElement = null;
        this.draggedId  = null;
        this.dragOverElement = null;
        this.isDragging = false;
    }
     init() {
        this.enableDragging();
    }

   enableDragging(){
         this.navbar.addEventListener("dragstart", (e) => {
            const node = e.target.closest(".opn-tree-node");
             if (!node) return;
             this.draggedId = node.dataset.navModelId;
             console.log(`Dragging element ${node.dataset.navModelId}`);
             
             e.dataTransfer.effectAllowed = "move";
             e.dataTransfer.setData("text/plain", this.draggedId);
             node.classList.add("opn-dragging")
               this.isDragging = true;
         })
          this.navbar.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";


            const node = e.target.closest(".opn-tree-node");
            if (!node) return;

            node.classList.add("opn-drag-over");
        });
        this.navbar.addEventListener("dragleave", (e) => {
            const node = e.target.closest(".opn-tree-node");
            if (!node) return;

            node.classList.remove("opn-drag-over");
        });
         this.navbar.addEventListener("drop", (e) => {
            e.preventDefault();

            const targetNode = e.target.closest(".opn-tree-node");
            if (!targetNode) return;

            this.handleDrop(targetNode, e);
             this.clearIndicators();
        });

   }

   clearIndicators() {
    document.querySelectorAll(".opn-drag-over").forEach(el => {
        el.classList.remove("opn-drag-over");
    });
    document.querySelectorAll(".opn-dragging").forEach(el => {
        el.classList.remove("opn-dragging");
    });
 }



    
   

   getDropPosition(targetEl, e ) {
        const rect = targetEl.getBoundingClientRect();
        const offsetY = e.clientY - rect.top
        if (offsetY < rect.height * 0.25) return "before";
        if (offsetY > rect.height * 0.75) return "after";
        return "inside";
   }
   isValidDrop(sourceModel, targetModel) {
    const sourceType = sourceModel.get("shortcode");
    const targetType = targetModel.get("shortcode");

    const rules = DROP_RULES[sourceType] || DROP_RULES["*"];

        // Check parent constraint
       if (!rules.parents.includes(targetType) && !rules.parents.includes("*")) {
            return false;
        }
        return true;
    }

   handleDrop( targetEl, event){
         const sourceId = this.draggedId;
         const targetId = targetEl.dataset.navModelId;
         if (sourceId === targetId) return;
         
        const sourceModel = this.vc.shortcodes.get(sourceId);
        const targetModel = this.vc.shortcodes.get(targetId);
         if (!sourceModel || !targetModel) return;
        const position = this.getDropPosition(targetEl, event);
         console.log(`Position is ${position}`);
       console.log(`Source: ${sourceModel.id} (${sourceModel.get('shortcode')}) | Target: ${targetModel.id} (${targetModel.get('shortcode')})`);
         
        let newParentId;
        let newIndex;
        // ============================
        // INSIDE DROP
        // ============================

       const currentParentId = sourceModel.get("parent_id");
        const targetParentId = targetModel.get("parent_id");

        console.log(`CurrentParent ID: ${currentParentId} TargetParentId: ${targetParentId}`);
        


        if( position === "inside"){
             if (!this.isValidDrop(sourceModel, targetModel)) {
              console.warn("Invalid drop inside");
              return;
             }
            newParentId = targetId;

            // if drop inside the current parent 
            if( targetId === currentParentId ){
                return
            }
            //Get childrens of target node
            const children = vc.shortcodes.where({ parent_id: targetId });
            newIndex = children.length;
        }
        // ============================
        // BEFORE / AFTER DROP
        // ============================
        else{
             

            if (!this.isValidDrop(sourceModel, vc.shortcodes.get(targetParentId))) {
                console.warn("Invalid sibling drop");
                return;
            }
               
              const siblings = vc.shortcodes.where({ parent_id: targetParentId });

             const targetIndex = siblings.findIndex(m => m.id === targetId);

            newParentId = targetParentId;
            newIndex = position === "before"
                ? targetIndex
                : targetIndex + 1;
             
        }
           console.log(`new Index :${newIndex}`);
        
         // Update navbar instantly (visual feedback)
           this.moveNavbarNode(sourceId, targetId, position);
           //Update WPBakery model (REAL SOURCE OF TRUTH)
        this.applyModelMove(sourceId, newParentId, newIndex);

   }


   moveNavbarNode(sourceId,targetId, position){
         const sourceNode = this.navbar.querySelector(`[data-nav-model-id="${sourceId}"]`);
        const targetNode = this.navbar.querySelector(`[data-nav-model-id="${targetId}"]`);
        if (!sourceNode || !targetNode) return;
        if (position === "inside"){
              targetNode.appendChild(sourceNode);
        }else if (position === "before") {
              // MOVES sourceNode BEFORE targetNode (as previous sibling)
            targetNode.parentNode.insertBefore(sourceNode, targetNode);
        } else {
             // MOVES sourceNode AFTER targetNode (as next sibling)
            targetNode.parentNode.insertBefore(sourceNode, targetNode.nextSibling);
        }
   }
  
  applyModelMove(sourceId, newParentId, newIndex){
        const sourceModel = this.vc.shortcodes.get(sourceId);
         if (!sourceModel) return;
         // remove from collection

          // Get the current view to remove its element
          const sourceView =sourceModel.view;
          if (sourceView && sourceView.$el) {
           sourceView.$el.remove(); // Remove old DOM
         }
        this.vc.shortcodes.remove(sourceModel);
        // update parent
        sourceModel.set("parent_id", newParentId);
       
        this.vc.shortcodes.add(sourceModel, { at: newIndex });
        
        // Update storage with the model directly 
        this.vc.storage.update(sourceModel);
        
        console.log(`✔ Model moved & saved → ${sourceId} → parent ${newParentId} @ ${newIndex}`);

  }

  

 

     
}

document.addEventListener("DOMContentLoaded", () => {


    if (typeof vc !== 'undefined' && vc.shortcodes) {
       console.log("WPBakery backend detected", vc.shortcodes.models, vc);

    setTimeout(() => {
        const tree = new ShortCodeTree(vc);
        tree.build();

        const navbar = new Navbar(tree);
    

        setTimeout(() => {
                
            navbar.init();
            const dragManager = new DragDropManager(vc,tree,navbar)
            dragManager.init();
        }, 500);

    }, 2000);
   }
       
})

