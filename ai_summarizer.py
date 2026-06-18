"""
AI Summarizer for Hospital Management System.

Two modes:
1. EXTRACTIVE (default) - TF-IDF sentence scoring, fast, no dependencies
2. TRANSFORMERS - Set USE_TRANSFORMERS=1 for BART neural summarization
   (requires: pip install transformers torch, ~460 MB download on first use)
"""

import os
import re
import logging

logger = logging.getLogger(__name__)

USE_TRANSFORMERS = os.environ.get("USE_TRANSFORMERS", "").lower() in ("1", "true", "yes")
TRANSFORMERS_MODEL = os.environ.get("TRANSFORMERS_MODEL", "sshleifer/distilbart-cnn-6-6")


class MedicalSummarizer:
    def __init__(self):
        self.tokenizer = None
        self.model = None

    def _load_transformers(self):
        try:
            from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
            self.tokenizer = AutoTokenizer.from_pretrained(TRANSFORMERS_MODEL)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(
                TRANSFORMERS_MODEL, low_cpu_mem_usage=True
            )
            logger.info(f"Loaded {TRANSFORMERS_MODEL}")
        except Exception as e:
            logger.warning(f"Transformers unavailable: {e}")

    def _bart_summarize(self, text: str) -> str:
        inputs = self.tokenizer(text, return_tensors="pt", max_length=1024, truncation=True)
        summary_ids = self.model.generate(
            inputs["input_ids"],
            max_length=150, min_length=40,
            num_beams=4, length_penalty=2.0, early_stopping=True,
        )
        return self.tokenizer.decode(summary_ids[0], skip_special_tokens=True)

    def extractive_summarize(self, text: str, max_sentences: int = 5) -> str:
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
        if not sentences:
            return "No content to summarize."
        if len(sentences) <= max_sentences:
            return " ".join(sentences)

        stop_words = set('''
            a an the and or but in on at to for of by with is are was were be been
            being have has had do does did will would could should may might shall
            can need dare ought used this that these those i he she it we they you
            me him her us them my your his its our their from as into through during
            before after above below between about up down out off over under again
            further then once here there when where why how all each every both few
            more most other some such no nor not only own same so than too very just
            also if
        '''.split())

        word_freq = {}
        for sent in sentences:
            for w in re.findall(r'[a-zA-Z]{3,}', sent.lower()):
                if w not in stop_words:
                    word_freq[w] = word_freq.get(w, 0) + 1

        sent_scores = {}
        for i, sent in enumerate(sentences):
            words = re.findall(r'[a-zA-Z]{3,}', sent.lower())
            if words:
                sent_scores[i] = sum(word_freq.get(w, 0) for w in words) / len(words)

        top = sorted(sent_scores, key=sent_scores.get, reverse=True)[:max_sentences]
        return " ".join(sentences[i] for i in sorted(top))

    def summarize(self, text: str) -> str:
        if not text or not text.strip():
            return "No content to summarize."
        if USE_TRANSFORMERS and self.model is None:
            self._load_transformers()
        if self.model is not None and self.tokenizer is not None:
            try:
                return self._bart_summarize(text)
            except Exception as e:
                logger.error(f"BART failed: {e}")
        return self.extractive_summarize(text)

    def generate_patient_summary(self, patient_data: dict) -> str:
        name = patient_data.get("name", "Unknown")
        age = patient_data.get("age", "N/A")
        gender = patient_data.get("gender", "N/A")
        contact = patient_data.get("contact", "N/A")
        history = patient_data.get("medical_history", "")
        docs = patient_data.get("documents", [])

        report = (
            f"Clinical Summary for {name}, {age}-year-old {gender}. "
            f"Contact: {contact}. "
        )
        if history:
            report += f"Medical history includes {history.strip('.')}. "
        if docs:
            report += f"Record contains {len(docs)} document(s): "
            report += ", ".join(d.get("filename", "file") for d in docs) + ". "
        if patient_data.get("previous_summaries"):
            report += "This is a follow-up summary with prior context available."

        return self.summarize(report)
