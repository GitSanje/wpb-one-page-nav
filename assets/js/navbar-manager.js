// class Navbar {

//     constructor(tree, state, bus) {

//         this.tree = tree;

//         this.state = state;

//         this.bus = bus;

//         this.rootNodes = [];

//         this.nav = document.createElement("div");

//         this.nav.className = "opn-custom-navbar";

//     }

//     init() {

//         this.createLayout();

//         this.renderRows();

//         this.bindEvents();

//     }

//     createLayout() {

//         this.nav.innerHTML = "";

//         const header = document.createElement("div");

//         header.className = "opn-navbar-header";

//         header.innerHTML = `

//                 <h3>📑 Page Navigation</h3>

//                 <div class="navbar-controls">

//                     <button class="opn-collapse-all">

//                         📁

//                     </button>

//                 </div>

//             `;

//         this.treeRoot = document.createElement("div");

//         this.treeRoot.className = "opn-navbar-tree";

//         this.nav.append(

//             header,

//             this.treeRoot

//         );

//         document.body.appendChild(this.nav);

//     }

//     renderRows() {

//         this.treeRoot.innerHTML = "";

//         this.rootNodes.length = 0;

//         const rows = this.tree
//             .getChildren(null);

//         rows.forEach(model => {

//             const node = new TreeNodeView(

//                 model,

//                 this.tree,

//                 this.state,

//                 this.bus

//             );

//             node.render();

//             this.rootNodes.push(node);

//             this.treeRoot.appendChild(
//                 node.el
//             );

//         });

//     }

//     bindEvents() {

//         this.bus.on(

//             "tree:changed",

//             () => {

//                 this.renderRows();

//             }

//         );

//     }
//      collapseAll() {

//         this.state.expanded.clear();

//         this.renderRows();

//     }

// }


// class TreeNodeView {

//     constructor(

//         model,

//         tree,

//         state,

//         bus

//     ) {

//         this.model = model;

//         this.tree = tree;

//         this.state = state;

//         this.bus = bus;

//         this.el = document.createElement("div");

//         this.el.className = "opn-tree-children";

//         this.el.dataset.id = model.id;

//     }
//     render() {

//         this.el.innerHTML = "";

//         const row = document.createElement("div");

//         row.className = "opn-tree-node";

//         row.dataset.id = this.model.id;

//         row.append(

//             this.makeToggle(),

//             this.makeIcon(),

//             this.makeLabel()

//         );

//         this.el.appendChild(row);

//         this.renderChildren();

//     }

//     makeIcon(){
//         const img = document.createElement("img");
//             img.src = wpbOnePageNav.plugin_url + 'assets/imgs/element-icon-row.svg';
//             img.alt = label;
//             img.classList.add("opn-nav-icon");
//         return img
//     }

//     makeToggle() {

//         const btn = document.createElement("button");

//         btn.className = "toggle";

//         btn.textContent =

//             this.state.isExpanded(

//                 this.model.id
//             )

//                 ? "▼"

//                 : "▶";

//         btn.onclick = () => {

//             this.state.toggle(
//                 this.model.id
//             );

//             this.renderChildren();

//         };

//         return btn;

//     }
//     renderChildren() {

//         if (this.childrenEl)

//             this.childrenEl.remove();

//         if (

//             !this.state.isExpanded(
//                 this.model.id
//             )

//         )
//             return;

//         this.childrenEl =

//             document.createElement("div");

//         this.childrenEl.className =

//             "opn-tree-children";

//         const children =

//             this.tree.getChildren(

//                 this.model.id

//             );

//         children.forEach(child => {

//             const node =

//                 new TreeNodeView(

//                     child,

//                     this.tree,

//                     this.state,

//                     this.bus

//                 );

//             node.render();

//             this.childrenEl.appendChild(

//                 node.el

//             );

//         });

//         this.el.appendChild(

//             this.childrenEl

//         );

//     }
//     makeLabel() {

//         const span =
//             document.createElement(
//                 "span"
//             );
//         span.className = "opn-tree-label";
//         const params =

//             this.model.get("params") || {};

//         span.textContent =

//             params.nav_label ||

//             this.model.get("shortcode");
//         span.onclick = () => {

//             this.bus.trigger(
//                 "node:selected",
//                 this.model
//             );

//         };

//         return span;

//     }

   
//     toggleWpRow() {

//         const row = document.querySelector(
//             `[data-model-id="${this.model.id}"]`
//         );

//         if (!row) return;

//         const toggle = row.querySelector(
//             ".vc_control-btn-prepend, .vc_toggle-btn, .vc_row_toggle"
//         );

//         if (toggle) {
//             toggle.click();
//         }

//     }

// }