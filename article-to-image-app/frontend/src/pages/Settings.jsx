import React from "react";
import { useStore } from "../store/useStore";
import { Button } from "../components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import axios from "axios";
import { useTranslation } from "react-i18next";

const Settings = () => {
	const { t } = useTranslation();
	const { inputData, preferences, setPreferences, setStep, setProcessing, addTraceStep, setResult } = useStore();

	const styles = [
		{ id: "Cinematic", name: t("settings.styles.cinematic"), desc: t("settings.styles.cinematic_desc"), color: "bg-blue-100" },
		{ id: "Cyberpunk", name: t("settings.styles.cyberpunk"), desc: t("settings.styles.cyberpunk_desc"), color: "bg-purple-100" },
		{ id: "Watercolor", name: t("settings.styles.watercolor"), desc: t("settings.styles.watercolor_desc"), color: "bg-green-100" },
		{ id: "Minimalist", name: t("settings.styles.minimalist"), desc: t("settings.styles.minimalist_desc"), color: "bg-gray-100" },
		{ id: "Anime", name: t("settings.styles.anime"), desc: t("settings.styles.anime_desc"), color: "bg-pink-100" },
	];

	const handleGenerate = async () => {
		setStep("generating");
		setProcessing(true);

		try {
			let payload = {
				type: inputData.type,
				preferences: preferences,
			};

			if (inputData.type === "text" || inputData.type === "url") {
				payload.data = inputData.value;
			} else {
				payload.data = "File content placeholder";
			}

			const response = await axios.post("http://localhost:3000/api/generate", payload);

			if (response.data.success) {
				const { trace, result } = response.data.data;

				for (const step of trace) {
					addTraceStep(step);
					await new Promise((r) => setTimeout(r, 800));
				}

				setResult(result);
				setProcessing(false);
				setTimeout(() => setStep("result"), 1000);
			}
		} catch (error) {
			console.error("Generation failed", error);
			setStep("input");
		}
	};

	return (
		<div className="max-w-4xl mx-auto p-6">
			<h2 className="text-3xl font-bold mb-8 text-center">{t("settings.title")}</h2>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				{styles.map((style) => (
					<div
						key={style.id}
						onClick={() => setPreferences({ ...preferences, style: style.id })}
						className={`
              cursor-pointer rounded-xl p-6 border-2 transition-all
              ${preferences.style === style.id ? "border-slate-900 shadow-lg scale-105" : "border-transparent bg-white hover:bg-slate-50"}
            `}>
						<div className={`w-12 h-12 ${style.color} rounded-full mb-4 flex items-center justify-center`}>
							<Sparkles className="w-6 h-6 text-slate-700" />
						</div>
						<h3 className="font-bold text-lg mb-2">{style.name}</h3>
						<p className="text-sm text-slate-500">{style.desc}</p>
					</div>
				))}
			</div>

			<div className="flex justify-center">
				<Button size="lg" className="w-full md:w-1/2 text-lg h-14 shadow-xl shadow-blue-500/20" onClick={handleGenerate}>
					{t("settings.buttons.generate")} <ArrowRight className="ml-2" />
				</Button>
			</div>
		</div>
	);
};

export default Settings;
