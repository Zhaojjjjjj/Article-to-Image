import React from "react";
import { useStore } from "./store/useStore";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Animation from "./pages/Animation";
import Result from "./pages/Result";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

function App() {
	const { step, isProcessing } = useStore();
	const { t, i18n } = useTranslation();

	const toggleLanguage = () => {
		const newLang = i18n.language === "en" ? "zh" : "en";
		i18n.changeLanguage(newLang);
	};

	const renderStep = () => {
		if (isProcessing) return <Animation />;

		switch (step) {
			case "input":
				return <Home />;
			case "settings":
				return <Settings />;
			case "generating":
				return <Animation />;
			case "result":
				return <Result />;
			default:
				return <Home />;
		}
	};

	return (
		<div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
			<header className="border-b bg-white sticky top-0 z-50">
				<div className="container mx-auto px-4 h-16 flex items-center justify-between">
					<div className="font-bold text-xl tracking-tight flex items-center gap-2">
						<div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">AI</div>
						{t("app.title")}
					</div>
					<nav className="flex items-center space-x-6 text-sm font-medium text-slate-600">
						<button onClick={toggleLanguage} className="flex items-center hover:text-slate-900 transition-colors">
							<Globe className="w-4 h-4 mr-1" />
							{i18n.language === "en" ? "中文" : "English"}
						</button>
						<a href="#" className="hidden md:block hover:text-slate-900">
							{t("app.nav.docs")}
						</a>
						<a href="#" className="hidden md:block hover:text-slate-900">
							{t("app.nav.history")}
						</a>
						<a href="#" className="hidden md:block hover:text-slate-900">
							{t("app.nav.account")}
						</a>
					</nav>
				</div>
			</header>

			<main className="container mx-auto px-4 py-8">{renderStep()}</main>
		</div>
	);
}

export default App;
