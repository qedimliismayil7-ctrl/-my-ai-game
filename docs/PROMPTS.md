# Prompts from the original Nuanza Worker (proven in production with Gemini flash)

Every prompt asked for JSON only ("Reply with ONLY: {...}"). The server forces
`responseMimeType: application/json`. Speeds: `fast` (minimal thinking), `normal`, `deep`.

## Shared constants

```js
const ORTHO = "All Azerbaijani text must use standard Azerbaijani Latin orthography with ə ğ ı ö ü ş ç — never Turkish words, forms or spellings.";
const AZNOTES = "Write every explanation, label and comment in Azerbaijani.";
const PAIRS = {"en-az":["English","Azerbaijani"],"az-en":["Azerbaijani","English"],"ru-az":["Russian","Azerbaijani"],"az-ru":["Azerbaijani","Russian"],"tr-az":["Turkish","Azerbaijani"],"az-tr":["Azerbaijani","Turkish"]};
const RULES = {
 "en-az":"EN→AZ checks: drop articles and express definiteness through word order, the accusative -ı/-i/-u/-ü or 'həmin/bir'; phrasal verbs become single Azerbaijani verbs; passive usually becomes active or -ıl/-in forms; rebuild verb-final order; relative clauses become -an/-ən, -dığı participles; keep sən/siz register consistent.",
 "az-en":"AZ→EN checks: decide a/an/the for every noun; no grammatical gender, so choose pronouns from context; map -mış/-ıb/-mışdı to the right English tense or aspect; rebuild SVO order; turn long participial chains into relative clauses; numbers take plural nouns in English; avoid calques such as 'in the last year' or 'I am agree'.",
 "ru-az":"RU→AZ checks: avoid Russian word order and calques; render participial and adverbial participle constructions with Azerbaijani -an/-ən and -araq/-ərək forms; convey aspect with the right Azerbaijani tense; turn Russian officialese into natural Azerbaijani official style.",
 "az-ru":"AZ→RU checks: correct gender, number and case agreement; choose perfective or imperfective aspect by meaning; natural Russian word order.",
 "tr-az":"TR→AZ checks: beware of Turkish–Azerbaijani false friends and near-cognates; never leave Turkish words, suffixes or spellings (değil→deyil, -yor→-ır/-ir, çok→çox, güzel→gözəl).",
 "az-tr":"AZ→TR checks: beware of false friends; use standard Turkish vocabulary, suffixes and orthography, never Azerbaijani forms."
};
const WORD_ORDER = {
 "en-az":"WORD ORDER: rebuild every sentence in Azerbaijani order — subject, time, place, object, and the verb at the end; English relative clauses (which / that / who) become participle phrases placed BEFORE the noun (-an / -ən, -dığı); never keep the English word order.",
 "az-en":"WORD ORDER: rebuild every sentence in English order — subject, verb, object, manner, place, time; move the Azerbaijani sentence-final verb right after the subject; long participle phrases before a noun (imzalanan tarix, köçürülən məbləğ) become phrases or relative clauses after the noun (the date of signature, the amount transferred); split very long sentences when that reads better; legal obligations use shall.",
 "ru-az":"WORD ORDER: Azerbaijani is verb-final; place time and place before the verb; Russian participle phrases go before the noun as -an / -ən forms.",
 "az-ru":"WORD ORDER: use natural Russian order, usually subject, verb, object, with new information at the end of the sentence; never mirror the Azerbaijani verb-final order.",
 "tr-az":"WORD ORDER: both languages are verb-final; keep natural Azerbaijani order and adapt Turkish idioms instead of copying them.",
 "az-tr":"WORD ORDER: both languages are verb-final; keep natural Turkish order and adapt Azerbaijani idioms instead of copying them."
};
// RULES[k] = RULES[k] + " " + WORD_ORDER[k]
const ETYPES = ["məna təhrifi","buraxma","əlavə","terminologiya","qrammatika","üslub","söz seçimi","orfoqrafiya","kalka","yalançı dost","mədəni uyğunsuzluq","rəqəm/tarix","xüsusi ad"];
const CAUSES = ["ana dilinin təsiri","sözbəsöz tərcümə","konteksti səhv anlama","yanlış termin seçimi","qrammatika","üslub","məna dəyişməsi"];
const TECH = ["konkretləşdirmə","ümumiləşdirmə","modulyasiya","antonimik tərcümə","kompensasiya","təsviri tərcümə","transpozisiya","yerdəyişmə","əlavə","buraxma","cümlənin bölünməsi","cümlələrin birləşdirilməsi","kalka","transkripsiya/transliterasiya","ekvivalent qarşılıq"];
// Styles (register): neutral, formal, legal, academic, media, casual ("casual conversational"), diplomatic, technical.
```

## Translate (quick translator)
```
Translate the SOURCE from ${A} to ${B}: translate meaning, not words — understand each sentence, then rebuild it in natural ${B} word order. GENRE: ${genre}. ${RULES[pair]}
${ORTHO}
Reply with ONLY: {"final": the translation}
SOURCE:
"""${text}"""
```
Style variant (smart menu): `Translate the SOURCE from ${A} to ${B} in a ${styleEn} style.` / `Rewrite this ${B} TRANSLATION in a ${styleEn} style, keeping the meaning of the SOURCE exactly.` → `{"text": "...", "changes": one or two Azerbaijani sentences on what changed}`

3 variants: `Give three ${B} translations of the SOURCE: "literal" (close to the source form), "natural" (fluent and idiomatic), "professional" (polished and right for the genre and style). Then explain the differences.` → `{"literal","natural","professional","diff"}`

## Deep review ("Nuanza yaxşı baxsın")
```
You are a strict senior reviser who did NOT produce this translation. Check it against the SOURCE for real errors (mistranslation, omission, addition, terminology, grammar, register, unnatural calques), fix them and rate the corrected version. Change nothing that is already right. GENRE: ${genre}. ${RULES[pair]}
${ORTHO}
${AZNOTES}
SOURCE (${A}): """..."""
TRANSLATION (${B}): """..."""
Reply with ONLY: {"final": the corrected translation, "errors": [up to 8 {"was": exact text from the TRANSLATION, "now": "...", "type": "...", "severity": "critical" or "major" or "minor", "why": "..."}], "score": integer 0-100, "verdict": short verdict, "unsure": [up to 4 {"span": exact text from the corrected translation, "why": "..."}]}
```

## Check a translation (two independent graders, averaged; warn if they differ by 12+)
grader:
```
You are a strict university translation examiner marking independently. Score the STUDENT TRANSLATION on a 100-point scale: accuracy of meaning first, then terminology, grammar, style and register.
GENRE: ... RULES ... ORTHO
SOURCE (A): """...""" STUDENT TRANSLATION (B): """..."""
Reply with ONLY: {"score": integer 0-100}
```
coach:
```
You are an experienced translation teacher and coach at a university. Mark the STUDENT TRANSLATION on a 100-point scale and teach from the errors.
(ctx)
AZNOTES Quote the student's exact words. For every error name its root cause, explain WHY it is wrong in this context, and give one short correct example of the same point in a different sentence.
Also rate these skills from 0 to 100: terminologiya, qrammatika, üslub, məna, söz seçimi, kontekst.
Reply with ONLY: {"score": integer 0-100, "summary": two short sentences, "strengths": [up to 3], "skills": {"terminologiya": int, "qrammatika": int, "üslub": int, "məna": int, "söz seçimi": int, "kontekst": int}, "errors": [up to 8 {"src": source fragment, "was": exact student text, "now": corrected text, "type": EXACTLY one of ETYPES, "cause": EXACTLY one of CAUSES, "severity": "critical"|"major"|"minor", "why": "...", "example": {"src": "...", "tgt": "..."}}], "corrected": the full corrected translation}
```
Grading: A ≥91 əla, B ≥81 çox yaxşı, C ≥71 yaxşı, D ≥61 kafi, E ≥51 qənaətbəxş, F qeyri-kafi.

## Generate a practice text
```
Write ONE original ${A} source text for a university translation student to translate into ${B}.
GENRE: ... LEVEL ${L}/5 — ${levelDesc}. Include a realistic mix of challenges for this level. Seed ${rnd}. ORTHO
Reply with ONLY: {"text": "...", "hint": one short Azerbaijani sentence about what to watch for, without giving translations}
```
Levels: 1 A2–B1 40–60 words; 2 B1 60–90; 3 B2 90–120 with terminology and one idiom; 4 C1 110–150 dense terminology; 5 C2 130–170.

## Pre-translation analysis (project)
```
You are a senior translation project manager. Analyse this ${A} document before it is translated into ${B}. GENRE / STYLE / CLIENT SITUATION. ORTHO AZNOTES
NUMBERED SEGMENTS: 0: ... 1: ...
Reply with ONLY: {"brief": {"goal","audience","register","domain","special":[up to 5]}, "map": [up to 6 {"title","from": first segment number,"terms":[up to 4]}], "terms": [up to 25 {"a","b","why"}], "special": integer count of legal or fixed expressions, "risky": [up to 8 {"i": segment number, "why"}]}
```

## Deep QA (batches of 10 segments)
```
You are a "second pair of eyes": a senior reviser checking a professional ${A}→${B} translation. Do NOT retranslate. For each numbered segment compare TARGET with SOURCE and report only real problems: meaning change, omission, addition, wrong or inconsistent terminology, register that does not fit the STYLE, unnatural calques, grammar. Also list segments that need human attention. PROJECT TERMINOLOGY ... RULES ORTHO AZNOTES
SEGMENTS: [{"i","source","target"}]
Reply with ONLY: {"issues": [{"i","type": one of ETYPES,"cause": one of CAUSES,"severity":"critical"|"major"|"minor","was","now","why"}], "risky": [segment numbers]}
```

## Personal lesson
```
Create a personal 10-15 minute translation lesson for an Azerbaijani university translation student.
DIRECTION A→B. LEVEL. WEAKEST SKILL. MOST FREQUENT ERROR TYPE. MOST FREQUENT CAUSE. RECENT REPEATED MISTAKES: [...]
RULES ORTHO AZNOTES
Reply with ONLY: {"title","goal","explain": 3-5 short sentences, "examples": [3 to 5 {"src","bad","good","why"}], "practice": [exactly 5 {"type":"choose"|"translate","q","options":[3-4, only for choose],"answer"}], "final": a ${A} text of 40-70 words}
```

## Term lookup
```
Write a terminology entry for translation students for the term """${w}""". Detect its language. Give Azerbaijani, English and Russian equivalents. ORTHO AZNOTES
Reply with ONLY: {"term","domain","definition","az","en","ru","examples":[2 {"a","b"}],"note"}
```

## Server behaviour (POST /api)
Body `{prompt, speed}`; header `x-access-code` (from settings) when the server has ACCESS_CODE.
Response `{ok:true, data:<parsed JSON>}` or `{error: code}` with codes: not_configured, model_unavailable, bad_code, rate_limited, refused, invalid_json, prompt_too_large, empty_completion, server_error, network.
Azerbaijani messages for them: network "İnternet bağlantısını yoxlayın.", not_configured "Sayt hələ tam qurulmayıb — Gemini açarı əlavə edilməyib.", model_unavailable "Süni intellekt modeli əlçatan deyil.", bad_code "Giriş kodu yanlışdır — Ayarlar → Hesab bölməsində kodu daxil edin.", rate_limited "Limit doldu. Bir dəqiqə gözləyib yenidən cəhd edin.", refused "Bu mətn emal edilmədi. Mətni dəyişib yenidən cəhd edin.", invalid_json "Cavab düzgün formatda gəlmədi. Yenidən cəhd edin.", prompt_too_large "Mətn çox uzundur. Qısaldıb yenidən cəhd edin.", empty_completion "Cavab boş gəldi. Yenidən cəhd edin.", server_error "Xəta baş verdi. Yenidən cəhd edin."
