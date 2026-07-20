const fs = require("fs");
const { execSync } = require("child_process");

const components = [
  { name: "Container.tsx", code: 'export function Container({children}: {children: React.ReactNode}) { return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>; }', msg: "feat(ui): add Container component" },
  { name: "Flex.tsx", code: 'export function Flex({children}: {children: React.ReactNode}) { return <div className="flex items-center justify-between">{children}</div>; }', msg: "feat(ui): add Flex layout component" },
  { name: "Grid.tsx", code: 'export function Grid({children}: {children: React.ReactNode}) { return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>; }', msg: "feat(ui): add Grid layout component" },
  { name: "Divider.tsx", code: 'export function Divider() { return <hr className="my-4 border-gray-200" />; }', msg: "feat(ui): add Divider component" },
  { name: "Skeleton.tsx", code: 'export function Skeleton({className=""}: {className?: string}) { return <div className={"animate-pulse bg-gray-200 rounded " + className} />; }', msg: "feat(ui): add Skeleton loader component" },
  { name: "Spinner.tsx", code: 'export function Spinner() { return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-celo-green" />; }', msg: "feat(ui): add Spinner component" },
  { name: "Alert.tsx", code: 'export function Alert({msg}: {msg: string}) { return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{msg}</div>; }', msg: "feat(ui): add Alert component" },
  { name: "Toast.tsx", code: 'export function Toast({msg}: {msg: string}) { return <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg">{msg}</div>; }', msg: "feat(ui): add Toast component" },
  { name: "Popover.tsx", code: 'export function Popover({children}: {children: React.ReactNode}) { return <div className="absolute z-10 bg-white shadow-lg rounded-xl p-4">{children}</div>; }', msg: "feat(ui): add Popover component" },
  { name: "Dropdown.tsx", code: 'export function Dropdown({children}: {children: React.ReactNode}) { return <div className="relative inline-block text-left">{children}</div>; }', msg: "feat(ui): add Dropdown wrapper component" },
  { name: "Tabs.tsx", code: 'export function Tabs({children}: {children: React.ReactNode}) { return <div className="flex border-b border-gray-200">{children}</div>; }', msg: "feat(ui): add Tabs component" },
  { name: "Sidebar.tsx", code: 'export function Sidebar({children}: {children: React.ReactNode}) { return <aside className="w-64 min-h-screen bg-white border-r">{children}</aside>; }', msg: "feat(ui): add Sidebar component" },
  { name: "Navbar.tsx", code: 'export function Navbar({children}: {children: React.ReactNode}) { return <nav className="bg-white shadow-sm h-16 flex items-center">{children}</nav>; }', msg: "feat(ui): add Navbar component" },
  { name: "TooltipContent.tsx", code: 'export function TooltipContent({text}: {text: string}) { return <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">{text}</div>; }', msg: "feat(ui): add TooltipContent component" },
];

components.forEach(comp => {
  fs.writeFileSync("app/components/ui/" + comp.name, comp.code);
  execSync("git add app/components/ui/" + comp.name);
  execSync('git commit -m "' + comp.msg + '"');
});
