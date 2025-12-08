import React, { useState } from "react";
import { useStore } from "../store/useStore";
import { Button } from "../components/ui/button";
import { Input, Textarea } from "../components/ui/input";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Link2, FileText, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";

const Home = () => {
	const { t } = useTranslation();
	const { setInputData, setStep } = useStore();
	const [activeTab, setActiveTab] = useState("text"); // text, url, file
	const [text, setText] = useState("");
	const [url, setUrl] = useState("");
	const [file, setFile] = useState(null);

	const handleSubmit = async () => {
		let data = activeTab === "text" ? text : activeTab === "url" ? url : file;

		if (!data) return;

		setInputData({ type: activeTab, value: data });
		setStep("settings");
	};

	return (
		<div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
			<div className="text-center mb-10 space-y-4">
				<h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">{t("app.title")}</h1>
				<p className="text-xl text-slate-600 max-w-2xl mx-auto">{t("app.subtitle")}</p>
			</div>

			<Card className="w-full max-w-2xl shadow-xl border-slate-200">
				<CardHeader>
					<div className="flex space-x-4 justify-center border-b pb-4">
						<button onClick={() => setActiveTab("text")} className={`flex items-center px-4 py-2 rounded-full transition-all ${activeTab === "text" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
							<FileText className="w-4 h-4 mr-2" /> {t("home.tabs.text")}
						</button>
						<button onClick={() => setActiveTab("url")} className={`flex items-center px-4 py-2 rounded-full transition-all ${activeTab === "url" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
							<Link2 className="w-4 h-4 mr-2" /> {t("home.tabs.url")}
						</button>
						<button onClick={() => setActiveTab("file")} className={`flex items-center px-4 py-2 rounded-full transition-all ${activeTab === "file" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
							<Upload className="w-4 h-4 mr-2" /> {t("home.tabs.file")}
						</button>
					</div>
				</CardHeader>
				<CardContent className="pt-6">
					{activeTab === "text" && <Textarea placeholder={t("home.placeholders.text")} className="min-h-[200px] text-lg p-4" value={text} onChange={(e) => setText(e.target.value)} />}

					{activeTab === "url" && <Input placeholder={t("home.placeholders.url")} className="h-12 text-lg" value={url} onChange={(e) => setUrl(e.target.value)} />}

					{activeTab === "file" && (
						<div className="border-2 border-dashed border-slate-200 rounded-lg p-10 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
							<input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files[0])} />
							<Upload className="w-10 h-10 mx-auto text-slate-400 mb-4" />
							<p className="text-slate-600 font-medium">{file ? file.name : t("home.placeholders.file")}</p>
						</div>
					)}

					<Button size="lg" className="w-full mt-6 text-lg h-14" onClick={handleSubmit} disabled={!text && !url && !file}>
						{t("home.buttons.next")}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
};

export default Home;
