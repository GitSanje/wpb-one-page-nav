
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

            if (shortcode === 'vc_row' ) {
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
                shortcode,
                order: model.get("order")

            })

        })

        for (const [parent, children] of this.map) {

            children.sort(
                (a,b) => a.order - b.order
            );

        }

        console.log("parent => children", this.map);

    } 


    getChildren(parentId) {
        return this.map.get(parentId) || [];
    }
    hasChildren(parentId) {
        return this.map.has(parentId) && this.map.get(parentId).length > 0;
    }
}




/*
   ============================================
   NAVBAR (UI + CONTROLLER)
   ============================================
   */
class Navbar {

    constructor(tree, element_type = "vc_row") {
        this.tree = tree;
        this.nav = document.createElement("div");
        this.nav.className = "opn-custom-navbar";
        this.sections = [];
        this.isClickScrolling = false;
        this.element_type = element_type




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

            // img.setAttribute("draggable", true); 

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
                top: target.offsetTop,
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

    collapseAll() {
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


    render() {

        this.collectSections();

        this.buildNavbar();

        this.attachEvents();

    }

}


const DROP_RULES = {
    vc_row: {
        parents: [null]
    },
    vc_column: {
        parents: ["vc_row"]
    },
    vc_column_inner: {
        parents: ["vc_column"]
    },
    "*": {
        parents: ["vc_column", "vc_column_inner"]
    }
};



class DragDropManager {
     
     constructor(vc, tree, navbar) {

        this.vc = vc;
        this.tree = tree;
        this.navbar = navbar.nav;
        this.navbarInstance = navbar;

        this.draggedId = null;
    }

     init() {

        this.bindDragEvents();
        this.bindCollectionEvents();

    }

    

      /*
    =====================================
    Backbone Sync
    =====================================
    */

    bindCollectionEvents() {

        this.vc.shortcodes.on(
            "change:parent_id change:order add remove",
            () => {
                this.tree.build();
                this.navbarInstance.render();
                console.log("Collection changed, tree and navbar updated");
            }
        );

    }

        /*
    =====================================
    Drag Events
    =====================================
    */

    bindDragEvents() {

        this.navbar.addEventListener("dragstart", this.onDragStart.bind(this));

        this.navbar.addEventListener("dragover", this.onDragOver.bind(this));

        this.navbar.addEventListener("dragleave", this.onDragLeave.bind(this));

        this.navbar.addEventListener("drop", this.onDrop.bind(this));

    }
    onDragStart(e) {

        const node = e.target.closest(".opn-tree-node");

        if (!node) return;

        this.draggedId = node.dataset.navModelId;

        e.dataTransfer.effectAllowed = "move";

        node.classList.add("opn-dragging");

    }
    onDragOver(e) {

        e.preventDefault();

        const node = e.target.closest(".opn-tree-node");

        if (!node) return;

        node.classList.add("opn-drag-over");

    }

    onDragLeave(e) {

        const node = e.target.closest(".opn-tree-node");

        if (!node) return;

        node.classList.remove("opn-drag-over");

    }

    onDrop(e) {

        e.preventDefault();

        const targetNode =
            e.target.closest(".opn-tree-node");

        if (!targetNode) return;

        this.handleDrop(
            this.draggedId,
            targetNode.dataset.navModelId,
            this.getDropPosition(targetNode, e)
        );

        this.clearIndicators();

    }
     
    clearIndicators() {

        this.navbar
            .querySelectorAll(
                ".opn-drag-over,.opn-dragging"
            )
            .forEach(el => {
                el.classList.remove(
                    "opn-drag-over",
                    "opn-dragging"
                );
            });

    }

      /*
    =====================================
    Drop Logic
    =====================================
    */

    handleDrop(sourceId, targetId, position) {

        if (sourceId === targetId) {
            return;
        }

        const source =
            this.vc.shortcodes.get(sourceId);

        const target =
            this.vc.shortcodes.get(targetId);

        if (!source || !target) {
            return;
        }

        if (this.isDescendant(sourceId, targetId)) {
            console.warn("Cannot drop into descendant");
            return;
        }

        const moveData =
            this.calculateMove(
                source,
                target,
                position
            );

        if (!moveData) {
            return;
        }

        this.moveModel(
            source,
            moveData.parentId,
            moveData.index
        );

    }


     /*
    =====================================
    Calculate Move
    =====================================
    */

    calculateMove(
        sourceModel,
        targetModel,
        position
    ) {

        const sourceParent =
            sourceModel.get("parent_id");

        const targetParent =
            targetModel.get("parent_id");

        let parentId;
        let index;

        if (
            position === "inside" &&
            this.isValidDrop(
                sourceModel,
                targetModel
            )
        ) {

            parentId = targetModel.id;

            index =
                this.getChildren(parentId)
                    .length;

        } else {

            parentId = targetParent;

            if (
                !this.isValidDrop(
                    sourceModel,
                    this.vc.shortcodes.get(parentId)
                )
            ) {
                return null;
            }

            const siblings =
                this.getChildren(parentId);

            const targetIndex =
                siblings.findIndex(
                    m => m.id === targetModel.id
                );

            const sourceIndex =
                siblings.findIndex(
                    m => m.id === sourceModel.id
                );

            if (
                sourceParent === parentId &&
                sourceIndex < targetIndex
            ) {

                index =
                    position === "before"
                        ? targetIndex - 1
                        : targetIndex;

            } else {

                index =
                    position === "before"
                        ? targetIndex
                        : targetIndex + 1;
            }

        }

        return {
            parentId,
            index
        };

    }

      /*
    =====================================
    Backbone Move
    =====================================
    */

    moveModel(
    sourceModel,
    newParentId,
    newIndex
) {

    const oldParentId =
        sourceModel.get("parent_id");

    const sameParent =
        oldParentId === newParentId;

    sourceModel.set(
        "parent_id",
        newParentId
    );

    if (!sameParent) {

        this.reindexParent(
            oldParentId
        );

    }

    this.reindexParent(
        newParentId,
        sourceModel,
        newIndex
    );

    if (sourceModel.view) {
    sourceModel.view.render();
}

sourceModel.trigger("change");
}

    reindexParent(
        parentId,
        movedModel = null,
        targetIndex = null
    ) {

        let children =
            this.getChildren(parentId);

        if (movedModel) {

            children =
                children.filter(
                    m => m.id !== movedModel.id
                );

            children.splice(
                targetIndex,
                0,
                movedModel
            );

        }

        children.forEach(
            (model, index) => {

                model.set(
                    "order",
                    index + 1
                );

                this.vc.storage.update(
                    model
                );

            }
        );

    }




     /*
    =====================================
    Helpers
    =====================================
    */

    getChildren(parentId) {

        return this.vc.shortcodes
            .where({
                parent_id: parentId
            })
            .sort(
                (a, b) =>
                    a.get("order") -
                    b.get("order")
            );

    }
    isValidDrop(
        sourceModel,
        targetModel
    ) {

        if (!targetModel) {
            return false;
        }

        const sourceType =
            sourceModel.get("shortcode");

        const targetType =
            targetModel.get("shortcode");

        const rules =
            DROP_RULES[sourceType] ||
            DROP_RULES["*"];

        return (
            rules.parents.includes(
                targetType
            ) ||
            rules.parents.includes("*")
        );

    }

    isDescendant(
        sourceId,
        targetId
    ) {

        let current =
            this.vc.shortcodes.get(targetId);

        while (current) {

            if (
                current.get("parent_id") ===
                sourceId
            ) {
                return true;
            }

            current =
                this.vc.shortcodes.get(
                    current.get("parent_id")
                );
        }

        return false;

    }



     getDropPosition(
        targetEl,
        event
    ) {

        const rect =
            targetEl.getBoundingClientRect();

        const offsetY =
            event.clientY - rect.top;

        if (offsetY < rect.height * 0.25) {
            return "before";
        }

        if (offsetY > rect.height * 0.75) {
            return "after";
        }

        return "inside";

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
                const dragManager = new DragDropManager(vc, tree, navbar)
                dragManager.init();
            }, 500);

        }, 2000);
    }

})

