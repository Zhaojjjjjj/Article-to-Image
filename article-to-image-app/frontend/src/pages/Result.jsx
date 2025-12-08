import React from "react";
import { useStore } from "../store/useStore";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Download, RefreshCw, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const Result = () => {
	const { t } = useTranslation();
	const { generatedResult, reset, preferences } = useStore();

	if (!generatedResult) return null;

	return (
		<div className="max-w-6xl mx-auto p-6">
			<div className="flex justify-between items-center mb-8">
				<div>
					<h2 className="text-3xl font-bold text-slate-900">{t("result.title")}</h2>
					<p className="text-slate-500">
						{t("result.style")}: {preferences.style}
					</p>
				</div>
				<div className="flex space-x-2">
					<Button variant="outline" onClick={reset}>
						<RefreshCw className="w-4 h-4 mr-2" /> {t("result.buttons.new")}
					</Button>
					<Button>
						<Download className="w-4 h-4 mr-2" /> {t("result.buttons.download")}
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Main Image (Rank 1) */}
				<div className="space-y-4">
					<div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-900 group">
						<img src={generatedResult.images[0].url} alt="Main Result" className="w-full h-auto object-cover" />
						<div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-bold backdrop-blur-md">
							{t("result.rank")} #1 ({t("result.score")}: {generatedResult.images[0].score})
						</div>
					</div>

					<Card>
						<CardContent className="p-4 bg-slate-50">
							<div className="flex justify-between items-start mb-2">
								<h4 className="font-semibold text-sm uppercase text-slate-500 tracking-wider">{t("result.prompt")}</h4>
								<button className="text-slate-400 hover:text-slate-900">
									<Copy className="w-4 h-4" />
								</button>
							</div>
							<p className="text-slate-700 font-mono text-sm leading-relaxed">{generatedResult.prompt}</p>
						</CardContent>
					</Card>
				</div>

				{/* Other Variations */}
				<div className="grid grid-cols-1 gap-4">
					<h3 className="font-semibold text-slate-900">{t("result.variations")}</h3>
					<div className="grid grid-cols-2 gap-4">
						{generatedResult.images.slice(1).map((img, idx) => (
							<div key={idx} className="relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group">
								<img src={img.url} alt={`Variation ${idx}`} className="w-full h-48 object-cover" />
								<div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
									{t("result.score")}: {img.score}
								</div>
							</div>
						))}
					</div>

					<div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mt-4">
						<h4 className="font-bold text-blue-900 mb-2">{t("result.strategy")}</h4>
						<ul className="space-y-2 text-sm text-blue-800">
							<li>
								• <strong>{t("result.strategy_items.style")}:</strong> {generatedResult.visualPlan.style}
							</li>
							<li>
								• <strong>{t("result.strategy_items.composition")}:</strong> {generatedResult.visualPlan.composition}
							</li>
							<li>
								• <strong>{t("result.strategy_items.lighting")}:</strong> {generatedResult.visualPlan.lighting}
							</li>
							<li>
								• <strong>{t("result.strategy_items.palette")}:</strong> {generatedResult.visualPlan.colorPalette.join(", ")}
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Result;
