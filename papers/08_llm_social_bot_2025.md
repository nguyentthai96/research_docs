Title: Adversarial Creation and Detection of AI-Generated Social Bot Content

URL Source: https://arxiv.org/html/2606.07219

Published Time: Mon, 08 Jun 2026 00:43:33 GMT

Markdown Content:
Mykola Trokhymovych 1,2, Ricardo Baeza-Yates 1,3, Alessandro Flammini 2, 

Diego Saez-Trumper 1, Filippo Menczer 2
1 Universitat Pompeu Fabra, Barcelona, Spain, 

2 Observatory on Social Media, Indiana University, Bloomington, Indiana, USA, 

3 KTH Royal Institute of Technology, Stockholm, Sweden 

Correspondence:[mykola.trokhymovych@upf.edu](https://arxiv.org/html/2606.07219v1/mailto:mykola.trokhymovych@upf.edu)

###### Abstract

The convergence of large language models and social bots allows malicious actors to manipulate the information ecosystem by generating human-like content at scale. Existing models for detecting AI-generated content often fail in the wild, primarily due to the lack of ground-truth data. We address this gap through an adversarial methodology that models the impersonation of real social media users by malicious actors. Using this methodology, we curate a multilingual, cross-platform dataset of paired human and AI-generated messages. Training on such adversarial data yields accurate detection of AI-generated text. Our approach significantly outperforms existing models for content-based bot detection in real-world, out-of-distribution data.

Adversarial Creation and Detection of AI-Generated Social Bot Content

Mykola Trokhymovych 1,2, Ricardo Baeza-Yates 1,3, Alessandro Flammini 2,Diego Saez-Trumper 1, Filippo Menczer 2 1 Universitat Pompeu Fabra, Barcelona, Spain,2 Observatory on Social Media, Indiana University, Bloomington, Indiana, USA,3 KTH Royal Institute of Technology, Stockholm, Sweden Correspondence:[mykola.trokhymovych@upf.edu](https://arxiv.org/html/2606.07219v1/mailto:mykola.trokhymovych@upf.edu)

## 1 Introduction

The convergence of Large Language Models (LLMs) and social bots enables the generation of inauthentic content and interactions at scale, for example to spread misinformation on social media Mozes et al. ([2023](https://arxiv.org/html/2606.07219#bib.bib58 "Use of llms for illicit purposes: threats, prevention measures, and vulnerabilities")). This poses unprecedented threats to democracy Schroeder et al. ([2026](https://arxiv.org/html/2606.07219#bib.bib3 "How Malicious AI Swarms Can Threaten Democracy")). While bot detection tools have historically relied on metadata and network analysis in combination with basic content analysis Ferrara et al. ([2016](https://arxiv.org/html/2606.07219#bib.bib36 "The rise of social bots")); Yang et al. ([2022](https://arxiv.org/html/2606.07219#bib.bib41 "Botometer 101: social bot practicum for computational social scientists"), [2025](https://arxiv.org/html/2606.07219#bib.bib35 "Social bots: detection and challenges")), those methods are ineffective at detecting sophisticated bots that employ AI models Yang and Menczer ([2024](https://arxiv.org/html/2606.07219#bib.bib43 "Anatomy of an ai-powered malicious social botnet")). We posit that advanced content analysis may provide stronger clues about AI-supported bots.

However, it is now challenging to distinguish AI-generated content from human text Fiedler and Döpke ([2025](https://arxiv.org/html/2606.07219#bib.bib62 "Do humans identify ai-generated text better than machines? evidence based on excerpts from german theses")). OpenAI, for instance, withdrew its classification tool because it could not reliably spot the difference.1 1 1[https://openai.com/blog/new-ai-classifier-for-indicating-ai-written-text](https://openai.com/blog/new-ai-classifier-for-indicating-ai-written-text) Recent advancements propose various solutions, ranging from supervised Wang et al. ([2024b](https://arxiv.org/html/2606.07219#bib.bib63 "M4: multi-generator, multi-domain, and multi-lingual black-box machine-generated text detection")) and zero-shot Hans et al. ([2024](https://arxiv.org/html/2606.07219#bib.bib20 "Spotting llms with binoculars: zero-shot detection of machine-generated text")) models to retrieval Sadasivan et al. ([2024](https://arxiv.org/html/2606.07219#bib.bib55 "Can ai-generated text be reliably detected?")) and watermarking Kirchenbauer et al. ([2023](https://arxiv.org/html/2606.07219#bib.bib56 "A watermark for large language models")) techniques.

![Image 1: Refer to caption](https://arxiv.org/html/2606.07219v1/figures/teaser.png)

Figure 1: Pipeline for content-based detection of AI-powered social bots.

Almost all of these methods suffer from a critical limitation: they perform poorly with short text Chakraborty et al. ([2024](https://arxiv.org/html/2606.07219#bib.bib59 "Position: on the possibilities of AI-generated text detection")). This is particularly concerning given that social media posts are usually short and stylistically diverse. Furthermore, there is a lack of robust benchmarks that capture the complexity of AI-generated text in social media. Most existing datasets rely on generic paraphrasing or direct generation strategies rather than realistic user imitation Macko et al. ([2025](https://arxiv.org/html/2606.07219#bib.bib27 "MultiSocial: multilingual benchmark of machine-generated text detection of social-media texts")).

A way to generate realistic training data for the robust detection of AI-powered bots is to emulate such bots in an adversarial setting. To this end, we constructed a data-generation pipeline that attempts to capture the behavior of potential malicious actors. Specifically, our methodology is to imitate real users who write to specific discussions, based on their profiles and historical messaging behaviors. Rather than treating the detection of AI-generated social media content purely as a text classification problem, this approach captures crucial contextual dimensions like platform affordances and the identity, interactions, stance, and unique writing style of the emulated content creator.

Our pipeline shown in Figure [1](https://arxiv.org/html/2606.07219#S1.F1 "Figure 1 ‣ 1 Introduction ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content") constructs a dataset of paired human and AI-generated messages, enriched with social network metadata, which presents a challenge for existing detectors. We leverage this dataset to train new classification models and demonstrate their effectiveness in detecting AI-powered social bots on real-world, out-of-distribution data.

The key contributions of this study are two-fold:

*   •
An adversarial methodology that mimics real users by generating social media content; and

*   •
Content-based models to detect AI-powered social bots with high accuracy on out-of-distribution, real-world data.

The rest of the paper is organized as follows. Section 2 reviews related work on automated social media behavior and AI-generated content detection. Section 3 describes the data collection, generation pipeline, and dataset characteristics. Section 4 presents the detection models, including both training-free and training-based approaches. Section 5 reports experimental results and sensitivity analysis. Section 6 concludes the paper and discusses limitations and ethical considerations.

## 2 Related Work

### 2.1 Automated Behavior in Social Media

Computer algorithms that automatically produce content and interact with humans on social media (a.k.a.social bots) have long been identified as influential actors online Ferrara et al. ([2016](https://arxiv.org/html/2606.07219#bib.bib36 "The rise of social bots")); Shao et al. ([2018](https://arxiv.org/html/2606.07219#bib.bib1 "The spread of low-credibility content by social bots")); Benevenuto et al. ([2010](https://arxiv.org/html/2606.07219#bib.bib61 "Detecting spammers on twitter")).

Historically, social bots have been characterized by behavioral features such as high posting rates, regular activity, and anomalous network connectivity strategies Chu et al. ([2012](https://arxiv.org/html/2606.07219#bib.bib39 "Detecting automation of twitter accounts: are you a human, bot, or cyborg?")); Varol et al. ([2017](https://arxiv.org/html/2606.07219#bib.bib38 "Online human-bot interactions: detection, estimation, and characterization")). Such bots often use easily-automated linguistic patterns (e.g., heavy use of hashtags, repetitive positive terms) and simple replies, in contrast to the more conversational style of human users Ng and Carley ([2025](https://arxiv.org/html/2606.07219#bib.bib37 "A global comparison of social media bot and human characteristics")).

Detection frameworks like Botometer have operationalized these signals, analyzing features extracted from account metadata, behavioral patterns, social network structure, and content to estimate the likelihood that an account is a bot Davis et al. ([2016](https://arxiv.org/html/2606.07219#bib.bib40 "BotOrNot: a system to evaluate social bots")); Yang et al. ([2022](https://arxiv.org/html/2606.07219#bib.bib41 "Botometer 101: social bot practicum for computational social scientists")). At the same time, bot operators actively improve their strategies to bypass detection models, creating an arms race that requires frequent tool refinement Yang et al. ([2019](https://arxiv.org/html/2606.07219#bib.bib42 "Arming the public with artificial intelligence to counter social bots")).

This landscape has shifted dramatically in recent years. On the one hand, platforms are making it difficult to access data for extracting account features beyond content. On the other hand, the rise of generative AI for content generation now allows bots to produce human-like text that makes traditional content-based detection algorithms ineffective Ferrara ([2024](https://arxiv.org/html/2606.07219#bib.bib44 "GenAI against humanity: nefarious applications of generative artificial intelligence and large language models")); Yang and Menczer ([2024](https://arxiv.org/html/2606.07219#bib.bib43 "Anatomy of an ai-powered malicious social botnet")).

### 2.2 AI-Generated Content in Social Media

The rapid development of large language models has substantially increased the realism of synthetic text Tang et al. ([2024](https://arxiv.org/html/2606.07219#bib.bib45 "The science of detecting llm-generated text")). Modern LLMs can produce coherent, human-like content adapted for specific scenarios using only simple prompts, without the need for additional training Brown et al. ([2020](https://arxiv.org/html/2606.07219#bib.bib46 "Language models are few-shot learners")). The availability of open-weight models and inference-as-a-service platforms has substantially boosted the accessibility of these tools in recent years Wolf et al. ([2020](https://arxiv.org/html/2606.07219#bib.bib47 "Transformers: state-of-the-art natural language processing")).

These models can be used to simulate social media personas and participate in online conversations by imitating the stylistic nuances of authentic user text Malik et al. ([2024](https://arxiv.org/html/2606.07219#bib.bib48 "An empirical analysis of the writing styles of persona-assigned LLMs")); Balog et al. ([2024](https://arxiv.org/html/2606.07219#bib.bib49 "Towards realistic synthetic user-generated content: a scaffolding approach to generating online discussions")). A recent study found a substantial increase in the rate of AI-generated text on social media since 2022, when LLMs became widely used by the general public Sun et al. ([2025](https://arxiv.org/html/2606.07219#bib.bib50 "Are we in the AI-generated text world already? quantifying and monitoring AIGT on social media")).

Detecting AI-generated content is important to understand its impact in general, and in particular to combat malicious applications such as impersonation, fraud, fake reviews, and disinformation Yang et al. ([2024a](https://arxiv.org/html/2606.07219#bib.bib2 "Characteristics and prevalence of fake social media profiles with ai-generated faces")); Crothers et al. ([2023](https://arxiv.org/html/2606.07219#bib.bib64 "Machine-generated text: a comprehensive survey of threat models and detection methods")); Weidinger et al. ([2022](https://arxiv.org/html/2606.07219#bib.bib65 "Taxonomy of risks posed by language models")). However, the lack of training data that accurately reflect real-world AI usage is a critical challenge to building robust detection systems. Although numerous prior studies have contributed datasets of AI-generated content, few have focused on social media. Selected examples of existing resources include MGTBench (essays, news, Reddit stories)He et al. ([2024](https://arxiv.org/html/2606.07219#bib.bib51 "MGTBench: Benchmarking Machine-Generated Text Detection")), M4GT-Bench (multi-domain, with limited social media coverage and restricted to English)Wang et al. ([2024a](https://arxiv.org/html/2606.07219#bib.bib52 "M4GT-bench: evaluation benchmark for black-box machine-generated text detection")), MULTITuDE (news only)Macko et al. ([2023](https://arxiv.org/html/2606.07219#bib.bib53 "MULTITuDE: large-scale multilingual machine-generated text detection benchmark")), and MAiDE-up (hotel reviews)Ignat et al. ([2025](https://arxiv.org/html/2606.07219#bib.bib54 "MAiDE-up: multilingual deception detection of AI-generated hotel reviews")).

AIGTBench Sun et al. ([2025](https://arxiv.org/html/2606.07219#bib.bib50 "Are we in the AI-generated text world already? quantifying and monitoring AIGT on social media")) aggregates human and synthetic text. The latter was generated by polishing, question-answering, and summary expansion based on articles from publishing and social media platforms. However, AIGTBench includes only English and has limited personalization. In contrast, the MultiSocial dataset Macko et al. ([2025](https://arxiv.org/html/2606.07219#bib.bib27 "MultiSocial: multilingual benchmark of machine-generated text detection of social-media texts")) offers a multilingual and multi-platform corpus, where synthetic samples were primarily generated by rephrasing social media messages.

These resources rely exclusively on synthetic AI-generated data, created in a controlled setting. Conversely, the Fox8-23 dataset Yang and Menczer ([2024](https://arxiv.org/html/2606.07219#bib.bib43 "Anatomy of an ai-powered malicious social botnet")) employs a collection strategy in the wild. The authors curated content from active Twitter accounts, establishing ground truth by identifying AI-powered social bots through their self-revealing messages.

In this paper, we also utilize a controlled generation setting. Unlike prior work, we incorporate social media context and imitate real user writing styles by conditioning the generation on a user’s persona and past messages.

## 3 Data

![Image 2: Refer to caption](https://arxiv.org/html/2606.07219v1/figures/dataset_schema_2.png)

Figure 2: Diagram of dataset curation steps.

![Image 3: Refer to caption](https://arxiv.org/html/2606.07219v1/figures/generation_pipeline.png)

Figure 3: Pipeline for creating realistic AI-generated messages in a social media context.

In this section, we present the methodology for constructing a dataset of paired human and AI-generated messages (see Figure[2](https://arxiv.org/html/2606.07219#S3.F2 "Figure 2 ‣ 3 Data ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content")). We start from real-world social media conversations, subsequently enriched with artificially generated messages. We describe the rationale for curating the initial data, the pipeline used to extend it with AI-generated content, and the key properties of the resulting dataset.

### 3.1 Data Collection

We collect a multilingual dataset that includes a variety of writing systems (e.g., Latin, Cyrillic, Arabic). We also ensure the inclusion of both high-resource and low-resource languages, at least for the testing part of the dataset. We use two large-scale communication platforms, Telegram and Reddit.

We collect Reddit data using the ConvoKit tool, which allows access to posts and comments created until October 2018 Baumgartner et al. ([2020](https://arxiv.org/html/2606.07219#bib.bib16 "The pushshift reddit dataset")); Chang et al. ([2020](https://arxiv.org/html/2606.07219#bib.bib10 "ConvoKit: a toolkit for the analysis of conversations")). Reddit is organized into subreddits, each typically focused on a specific topic. Although most of the subreddits are in English, there are communities where users communicate in other languages. These non-English subreddits are often country-specific and cover a broad range of topics, e.g., r/bulgaria or r/ukraina Koncar et al. ([2021](https://arxiv.org/html/2606.07219#bib.bib11 "Analysis and prediction of multilingual controversy on reddit")). We use this structure as a proxy for identifying conversations in non-English languages, assuming that subreddits dedicated to a particular country mostly contain content in the national language. For English data, we select subreddits focused on finance and politics to ensure topical diversity. Additionally, for some languages, we include subreddits from multiple countries to capture potential regional variation (e.g., r/es and r/chile for Spanish; r/portugal and r/brasil for Portuguese). We collect data from 20 subreddits that cover 15 languages.

For Telegram, we export the full chat history using the official Telegram desktop application. To select channels, we use the Telemetrio website,2 2 2[https://telemetr.io/](https://telemetr.io/), accessed 01-04-2025 focusing on public channels that provide access to open chat histories and that have the highest subscriber counts in the news or politics categories. At the time of data collection (10 April 2025), we downloaded the full chat history available for each selected channel. We gathered data from 16 open chats that cover 13 languages. In total, the dataset covers 17 languages.

### 3.2 Data Processing

We convert the data from both Telegram and Reddit conversations into a common thread format. Each thread consists of an initial post followed by its subsequent discussion. Only textual content is processed; all media files are excluded to avoid storing copyrighted or potentially illegal content, in line with prior practice La Morgia et al. ([2025](https://arxiv.org/html/2606.07219#bib.bib13 "TGDataset: collecting and exploring the largest telegram channels dataset")). Users are identified by their nicknames, which we anonymize using randomized identifiers to protect user privacy. We also replace any known nicknames appearing in messages with their corresponding anonymous identifiers.

For each channel or subreddit, we randomly sample up to 200 users, restricting our selection to those who have participated in at least 15 threads. This criterion ensures sufficient conversational history per user, which is necessary for the AI-based message generation process described later. In cases where fewer than 200 eligible users are available, all qualifying users are included. This sampling strategy helps balance the dataset across different languages and topics, contributing to more representative and diverse data coverage. Messages from Reddit users whose original nicknames appear as [removed] or [deleted] are excluded from the dataset, as we treat these cases as deleted content.

### 3.3 Generation Pipeline

Message generation follows a structured, multi-step pipeline (see Figure[3](https://arxiv.org/html/2606.07219#S3.F3 "Figure 3 ‣ 3 Data ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content")). The goal of this process is to generate realistic messages by imitating the behavior of a specific user within a given thread. The process includes three main components: (i)constructing a user persona based on their historical messages; (ii)retrieving conversational context, i.e., threads that are semantically similar to the current one to provide information about how the user typically responds in comparable situations; and (iii)generating the final message by prompting a language model to respond within the given thread.

First, the threads associated with each user are split into training and testing sets based on timestamps. The testing set, used for generating AI message pairs, consists of the most recent half of the user’s threads, capped at a maximum of 20 threads per user. The remaining threads are used for constructing the user persona and conversational context.

The user persona is generated by prompting a language model to produce a brief user description, identify the languages used in communication, and determine topics associated with both positive and negative sentiment. To construct the prompt, we sample up to 10 random conversations from the user’s training data and provide them as input. For this task, we use the openai/gpt-oss-20b model, configured to produce a structured output format suitable for downstream use. Full details of the prompt and model parameters are provided in Appendix[C](https://arxiv.org/html/2606.07219#A3 "Appendix C Data Generation Details ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content").

We generate text messages in two modes: with and without conversational context. Incorporating this context into the prompt allows us to more directly reflect the user’s writing style, going beyond a generic user persona, which often struggles to fully capture the complexities of individual experiences and communication nuances Malik et al. ([2024](https://arxiv.org/html/2606.07219#bib.bib48 "An empirical analysis of the writing styles of persona-assigned LLMs")); Ng et al. ([2024](https://arxiv.org/html/2606.07219#bib.bib17 "How well can llms echo us? evaluating ai chatbots’ role-play ability with echo")). To retrieve related threads for the conversational context, we use the google/embeddinggemma-300m 3 3 3[https://huggingface.co/google/embeddinggemma-300m](https://huggingface.co/google/embeddinggemma-300m) model to generate embeddings for each thread and perform similarity search using cosine similarity. This model was selected for its strong performance on benchmark tasks, robust multilingual support, and extended context window capabilities. For each target thread in the test set, we retrieve the five most similar threads from the user’s training data, which are then used as additional context during the final message generation stage.

Finally, the target message context, the generated user persona, and optionally the conversational context are provided as input to a generative model instructed to imitate the target user. Specifically, the model generates a response to the thread in the same position where the target user did so. For this step, we use two open-source instruction-tuned models from different providers and with different numbers of parameters: Gemma-3n-E4B (8B)4 4 4[https://huggingface.co/google/gemma-3n-E4B-it](https://huggingface.co/google/gemma-3n-E4B-it) and Qwen3-235B-A22B (235B).5 5 5[https://huggingface.co/Qwen/Qwen3-235B-A22B-Instruct-2507](https://huggingface.co/Qwen/Qwen3-235B-A22B-Instruct-2507) Full details of the prompt structure and model parameters are provided in Appendix[C](https://arxiv.org/html/2606.07219#A3 "Appendix C Data Generation Details ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content").

To increase the difficulty of distinguishing between real and AI-generated messages, we explicitly instruct each model to generate responses with a length approximately matching the original human-written message; messages with fewer than ten characters of text are excluded. Furthermore, we consider only the first message authored by the target user within each thread as the generation target, discarding any subsequent messages in the same thread.

### 3.4 Data Postprocessing

To make the dataset more realistic and challenging, we replace long dashes with short dashes and curly quotation marks with straight quotes in the generated texts, unless the target user used such characters in their prior conversations. This adjustment is intended to eliminate basic textual artifacts that may signal AI-generated content Das et al. ([2024](https://arxiv.org/html/2606.07219#bib.bib18 "Under the surface: tracking the artifactuality of llm-generated data")). We avoid advanced humanization techniques or stylistic enhancements to keep the generation scenario simple and still realistic. We also filter out approximately 0.2% of samples that include any artifacts related to the prompt.

We estimate the language of both real and generated messages using the lingua-py tool.6 6 6[https://github.com/pemistahl/lingua-py](https://github.com/pemistahl/lingua-py) We filter out pairs in which the generated text does not match the language of the real one. We further filter out pairs where the detected language of the real or generated text is undefined. This often happens when text is too short or consists mostly of emoticons, numbers, symbols, or gibberish. We also filter pairs where the language is not among the 17 expected languages, as these are outside our scope.

Finally, we split the data at the user level to avoid data leakage between the training and testing sets. For each communication channel, we randomly select either 25% of users or a minimum of 50 users for smaller channels. Additionally, we reserve a 5% random sample of the training data as a validation set, applying the same user-based splitting logic to ensure consistency.

### 3.5 Data Characteristics

The dataset includes 73,521 unique real user messages, created in 36 Reddit or Telegram channels by 6,326 unique users in 17 languages. Considering the two generative models and two conversational context conditions, the dataset comprises 263,594 pairs of real and generated text. The testing part of the dataset comprises 1,772 unique users, with 71,455 messages generated in 14,288 unique threads.

Initial data analysis shows statistical differences between real and generated messages. On average, generated text is shorter (136 vs. 156 characters). Messages generated with conversational context are shorter than those without (130 vs. 143 characters). Moreover, real text contains a significantly higher density of links (4.2% vs. 0.6%) and user mentions (0.46% vs. 0.29%). These differences decrease when context is provided; for instance, the link rate for text generated without conversational context is 0.3% compared to 0.9% for those with context. This suggests that context integration results in generated content that more closely imitates the style of real users.

## 4 Detection Models

With the dataset of social-media text generated by imitating real users, we proceed to analyze how difficult it is to distinguish AI-generated messages from their corresponding original ones. Following the taxonomy of LLM-generated content detection models by Yang et al. ([2024b](https://arxiv.org/html/2606.07219#bib.bib22 "A survey on detection of LLMs-generated content")), we test training-free (a.k.a. zero-shot) detection and training-based methods. Each method produces a numerical score used to classify a message.

### 4.1 Training-Free Detectors

Training-free detectors rely on statistical patterns in text to distinguish between human and AI writing. This makes them broadly applicable and less dependent on the specific generation model, compared to training-based methods Wu et al. ([2025a](https://arxiv.org/html/2606.07219#bib.bib19 "A survey on llm-generated text detection: necessity, methods, and future directions")). This robustness is especially valuable for social-media data, where numerous users contribute diverse writing styles Hans et al. ([2024](https://arxiv.org/html/2606.07219#bib.bib20 "Spotting llms with binoculars: zero-shot detection of machine-generated text")).

In our experiments we test different training-free detectors, such as Binoculars Hans et al. ([2024](https://arxiv.org/html/2606.07219#bib.bib20 "Spotting llms with binoculars: zero-shot detection of machine-generated text")), FastDetectGPT Bao et al. ([2023](https://arxiv.org/html/2606.07219#bib.bib21 "Fast-detectgpt: efficient zero-shot detection of machine-generated text via conditional probability curvature")), and GECScore Wu et al. ([2025b](https://arxiv.org/html/2606.07219#bib.bib23 "Who wrote this? the key to zero-shot LLM-generated text detection is GECScore")). The Binoculars approach is based on a pair of LLMs. The models used in the original formulation do not support the multiple languages in our dataset, therefore we replace them by a pair of multilingual models of comparable size (Qwen2.5-7B-Instruct and Qwen2.5-7B), following previous research Quaremba et al. ([2025](https://arxiv.org/html/2606.07219#bib.bib26 "WETBench: a benchmark for detecting task-specific machine-generated text on Wikipedia")). We use the same models for FastDetectGPT. As for GECScore, we follow the logic from the original paper but use gpt-5-nano-2025-08-07, a more up-to-date and cost-efficient model. Additionally, we update the prompts to follow industry best practices, providing clearer instructions (see Appendix[C](https://arxiv.org/html/2606.07219#A3 "Appendix C Data Generation Details ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content")).

### 4.2 Training-Based Detectors

Training-based models generally achieve significantly better accuracy in detecting AI-generated social media content, but also tend to overfit, limiting generalization Macko et al. ([2025](https://arxiv.org/html/2606.07219#bib.bib27 "MultiSocial: multilingual benchmark of machine-generated text detection of social-media texts")). Using our dataset, we train custom detection models and evaluate both accuracy and generalization. We test two modeling approaches:

*   •
LFC: a linguistic features classifier;

*   •
TC: a transformer-based classifier.

For the LFC, we first use the LFTK tool 7 7 7[https://github.com/brucewlee/lftk](https://github.com/brucewlee/lftk) to extract the set of handcrafted linguistic features from text Lee and Lee ([2023](https://arxiv.org/html/2606.07219#bib.bib28 "LFTK: handcrafted features in computational linguistics")). We then train a classification model based on gradient boosting Dorogush et al. ([2017](https://arxiv.org/html/2606.07219#bib.bib29 "Fighting biases with dynamic boosting")).

### 4.3 Evaluation

Model accuracy is primarily assessed using the Area Under the Curve (ROC-AUC) metric, which quantifies the model’s ability to discriminate between human-authored and machine-generated messages across all classification thresholds. We use bootstrapping to compute confidence intervals (see Appendix[B](https://arxiv.org/html/2606.07219#A2 "Appendix B Confidence Intervals ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content") for details). To evaluate the robustness and generalization of the proposed models, we utilize Fox8-23 (cf.§[2.2](https://arxiv.org/html/2606.07219#S2.SS2 "2.2 AI-Generated Content in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content")) as an independent benchmark.

Finally, we average the scores of each user’s messages to obtain a user-level score. The goal is to classify users rather than individual messages, simulating the real-world scenario of detecting AI-powered social bots.

## 5 Results

### 5.1 AI-generated Text Detection

Firstly, we evaluate the accuracy of models for the task of detecting AI-generated text, where the input is a single social media post. We use the testing hold-out dataset and evaluate the training-free and training-based detectors discussed in §[4](https://arxiv.org/html/2606.07219#S4 "4 Detection Models ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). In addition, we evaluate two other supervised models trained on other datasets: OSM-Det 11 11 11 Training data was restricted to English; results may not generalize to multilingual contexts.Sun et al. ([2025](https://arxiv.org/html/2606.07219#bib.bib50 "Are we in the AI-generated text world already? quantifying and monitoring AIGT on social media")) and a transformer-based classifier based on XLM-RoBERTa, trained on the MultiSocial dataset (MS-based TC).

Table 1: AUC for the task of detecting AI-generated text. 95% confidence intervals are shown in this and the following tables. The best model is shown in bold.

Table 2: AUC for the detection of AI-generated text in external datasets.

The results in Table[1](https://arxiv.org/html/2606.07219#S5.T1 "Table 1 ‣ 5.1 AI-generated Text Detection ‣ 5 Results ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content") demonstrate that models trained on our data significantly outperform all baselines. The TC model based on the XLM-RoBERTa encoder is the most accurate. Training-free classifiers achieve accuracy comparable with models trained on external datasets.

To properly assess real-world robustness, we prioritize the Fox8-23 dataset. This is the only dataset strictly unseen during the training of all evaluated models and consists of “in-the-wild” data, representing a highly realistic application scenario. Table[2](https://arxiv.org/html/2606.07219#S5.T2 "Table 2 ‣ 5.1 AI-generated Text Detection ‣ 5 Results ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content") reveals a consistent pattern of in-domain bias among external models: the MultiSocial-based TC and OSM-Det achieve near-perfect scores on their respective training distributions, yet their accuracy drops substantially on Fox8-23. This suggests that generation strategies relying on rephrasing or modifying existing content do not provide sufficient training signal for robust, real-world detection. In contrast, models trained on our data significantly outperform all baselines on this benchmark, demonstrating the value of realistic, context-aware adversarial data.

### 5.2 AI-Powered Social Bot Detection

Table 3: AUC for the detection of AI-powered social bots.

Our findings show that detecting AI-generated content at the message level is challenging, especially given the moderate accuracy on out-of-distribution data. However, real-world setups usually require detecting the users who post AI-generated content (AI-powered social bots) rather than classifying each message independently. To simulate such a scenario, we evaluate accuracy at the user level.

We employ the Fox8-23 dataset as the primary out-of-distribution benchmark for this scenario. As mentioned earlier, this dataset consists of “in-the-wild” data. It includes user identifiers, making it possible to evaluate our models on this user classification task.

Our results are shown in Table[3](https://arxiv.org/html/2606.07219#S5.T3 "Table 3 ‣ 5.2 AI-Powered Social Bot Detection ‣ 5 Results ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). All models achieve significantly higher AUC scores for detecting AI-powered social bots than for individual message classification. The accuracy gain is observed on both our synthetically generated dataset and the real-world data (Fox8-23), but more pronounced on the latter. Transformer-based classifiers trained on our dataset significantly outperform other configurations. The best model achieves near-perfect accuracy on the Fox8-23 benchmark.

![Image 4: Refer to caption](https://arxiv.org/html/2606.07219v1/figures/bot_detection_with_ci_2.png)

Figure 4: AI-Powered bot detection accuracy as a function of the number of messages N per user, based on the Fox8-23 dataset. For each user, we randomly sampled N messages without replacement, calculating the mean AUC and a 95% confidence interval across 100 iterations per data point. 

Figure [4](https://arxiv.org/html/2606.07219#S5.F4 "Figure 4 ‣ 5.2 AI-Powered Social Bot Detection ‣ 5 Results ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content") reports on the impact of the number of messages available per user on detection accuracy, using the Fox8-23 dataset. As expected, AUC increases with the number of messages; with just 20 messages per user, our TC (mBERT) model achieves an AUC of approximately 0.97.

### 5.3 Sensitivity Analysis

Table 4: Model AUC for the task of AI-generated text detection depending on the length of the text (in number of characters).

Table 5: Model AUC for the task of AI-generated text detection depending on the platform.

Table 6: Model AUC for the task of AI-generated text detection depending on the model used for generation. Columns are sorted by the size of the model in ascending order.

Table 7: Model AUC for the task of AI-generated text detection depending on the availability of conversational context during message generation.

Table 8: Model AUC for the task of AI-generated text detection depending on language.

We evaluate the sensitivity of our results to various conditions, observing how accuracy is affected by text length, social media platform, the specific model used for generation, availability of conversational context, and language.

Our analysis indicates that detection accuracy is positively correlated with input length across all evaluated architectures (see Table[4](https://arxiv.org/html/2606.07219#S5.T4 "Table 4 ‣ 5.3 Sensitivity Analysis ‣ 5 Results ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content")). Specifically, the top-performing model, TC (RoBERTa), improved its AUC by about 7.5% as text went from 50 characters to more than 150 characters. Similar accuracy gains were observed across other configurations.

No substantial accuracy difference was observed across different social media platforms (see Table[5](https://arxiv.org/html/2606.07219#S5.T5 "Table 5 ‣ 5.3 Sensitivity Analysis ‣ 5 Results ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content")). The small variations identified may be attributed to differences in average message length; for instance, Reddit messages are typically longer compared to Telegram.

Detection accuracy depends on the size of the LLM used for generation (see Table[6](https://arxiv.org/html/2606.07219#S5.T6 "Table 6 ‣ 5.3 Sensitivity Analysis ‣ 5 Results ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content")). Text produced by smaller models tends to be more detectable than that generated by larger ones. Providing conversational context during generation also makes the resulting messages harder to detect for all models (see Table[7](https://arxiv.org/html/2606.07219#S5.T7 "Table 7 ‣ 5.3 Sensitivity Analysis ‣ 5 Results ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content")).

Finally, language-specific analysis demonstrates that the transformer classifiers trained on our dataset maintain high accuracy across all evaluated languages (see Table[8](https://arxiv.org/html/2606.07219#S5.T8 "Table 8 ‣ 5.3 Sensitivity Analysis ‣ 5 Results ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content")). This suggests that the proposed approach has multilingual capabilities. We only observe lower accuracy for Chinese.

## 6 Conclusions

This paper addresses the growing threat of AI-powered social bots that leverage large language models to generate human-like text. Since these bots are defined by the content they produce, detecting them requires analyzing that content directly. We proceed from the hypothesis that robust detection of AI-generated social media content requires training on realistic adversarial inputs.

We developed an adversarial data generation pipeline that emulates the behavior of malicious actors, while remaining adaptable to emerging LLMs. By conditioning text generation on the historical messaging behavior of users, our approach captures their unique writing styles and stances, producing synthetic content that closely mirrors how real users communicate.

Our data generation pipeline enabled the construction of a robust, multilingual, and cross-platform dataset comprising paired human and AI-generated messages. Using this data, we trained content-based classification models for AI-generated text detection and evaluated them against established baselines.

Our findings demonstrate that training on realistic, context-aware adversarial data not only achieves high accuracy in detecting AI-generated text, but more importantly, results in substantial accuracy improvement in identifying AI-powered social bots in real-world, out-of-distribution data.

### 6.1 Limitations

We developed our data generation pipeline with a focus on simplicity and scalability, mirroring the strategies likely employed by malicious actors who utilize open-weight LLMs or industry APIs without requiring significant computational resources. We acknowledge that more sophisticated strategies exist, such as fine-tuning LLMs for impersonation Shi et al. ([2025](https://arxiv.org/html/2606.07219#bib.bib60 "IMPersona: evaluating individual level LLM impersonation")). These methods demand substantially higher resources and are therefore less likely to be deployed at scale in real-world scenarios.

Another limitation of this study is the potential presence of existing automated activity in our human baseline, particularly within the Telegram dataset. The older Reddit data remains unaffected by recent LLMs. Additionally, the scope is limited to two platforms and popular channels. The focus on mainstream topics like news and politics introduces a selection bias that may affect the model’s accuracy on niche content. Future work should incorporate a broader array of platforms and less-prominent discussion topics to mitigate these biases.

By utilizing two open-weight LLMs of different sizes, we aimed to create a robust and generalizable benchmark. We found that larger, more powerful generation models produce content that is harder to detect, leading to a drop in classifier accuracy. This highlights a critical requirement for future detection systems: training data must be consistently updated with outputs from state-of-the-art models and varied prompting strategies to follow the evolving capabilities of LLMs.

Our analysis is limited to textual data. Integrating multi-modal content and activity metadata would likely yield significant improvements in bot detection accuracy. Nevertheless, the high-quality signals generated by our current models provide a strong baseline, which can be used in more complex ensemble or hybrid architectures to combat evolving bot threats.

Finally, we evaluate our approach using the Fox8-23 dataset as a real-world benchmark. This dataset has two important limitations. First, it was collected before AI content generation had reached its current sophistication. Second, it was built by identifying bots that openly revealed themselves, meaning the bots it contains were relatively easy to spot. Together, these factors suggest that detection models performing well on this benchmark may struggle significantly against more advanced bots found on today’s platforms.

### 6.2 Ethics Statement

Our models are designed to help identify AI-powered social bots. They can be used as standalone tools or integrated into larger detection systems that include account metadata and behavioral patterns. The primary goal is to provide a reliable signal for researchers and platform moderators to detect AI-generated content. These models should not be used for automated account bans. Because models can mistakenly identify real people as bots, any punishing action should involve human review. Furthermore, these models must not be used for the adversarial fine-tuning of LLMs to bypass detection.

By evaluating our models on established, publicly available benchmarks, we ensure reproducibility and adhere to the principles of open science. Our data collection methods were reviewed and approved by Indiana University Institutional Review Board. To train our models, we used a pre-existing public Reddit dataset from ConvoKit, along with manually exported data from 16 public Telegram broadcast channels and their linked discussion groups. We avoided automated scraping to respect the platform infrastructure. Detection models must operate in the wild, therefore we have not excluded hateful or inappropriate content that may appear in our training data; we do not endorse this speech. We are not publishing our data to avoid compromising the privacy and data ownership of real users.

While releasing a pipeline for generating realistic AI content presents a dual-use risk, we believe it is a necessary and responsible decision for defensive research.12 12 12[https://github.com/trokhymovych/ai-bot-detection](https://github.com/trokhymovych/ai-bot-detection) The pipeline utilizes well-known LLM practices, and sharing it enables the research community to actively understand and prepare for existing threats. To balance the risk of misuse, we are open-sourcing our trained detection model.13 13 13[https://huggingface.co/trokhymovych/mbert-ai-bot-detector](https://huggingface.co/trokhymovych/mbert-ai-bot-detector)

### 6.3 Future Work

Several directions could naturally extend this work. Our generation pipeline relies on prompt-based imitation with open-weight LLMs, mirroring low-resource adversarial setups. Fine-tuning generation models on per-user message histories could achieve closer stylistic imitation Shi et al. ([2025](https://arxiv.org/html/2606.07219#bib.bib60 "IMPersona: evaluating individual level LLM impersonation")). Incorporating texts generated by specialized models into training corpora is a promising approach to improving detectors for more advanced bots. The dataset can also be extended to include additional platforms and a wider range of topics, which would help mitigate selection bias.

Our detectors currently operate only on message text. Real-world bot detection systems typically combine content signals with account metadata, posting cadence, and network structure Yang et al. ([2022](https://arxiv.org/html/2606.07219#bib.bib41 "Botometer 101: social bot practicum for computational social scientists"), [2025](https://arxiv.org/html/2606.07219#bib.bib35 "Social bots: detection and challenges")). Studying how to optimally fuse content scores with behavioral and network features is a promising direction. Finally, since larger generation models produce harder-to-detect text (see Section[5.3](https://arxiv.org/html/2606.07219#S5.SS3 "5.3 Sensitivity Analysis ‣ 5 Results ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content")), keeping detection systems effective requires continuous retraining, suggesting the need to periodically refresh training data with outputs from state-of-the-art LLMs and prompting strategies.

## Acknowledgments

The work of Mykola Trokhymovych is supported by the Google PhD Fellowship and MCIN/AEI /10.13039/501100011033 under the Maria de Maeztu Units of Excellence Programme (CEX2021-001195-M).

## References

*   Towards realistic synthetic user-generated content: a scaffolding approach to generating online discussions. External Links: 2408.08379, [Link](https://arxiv.org/abs/2408.08379)Cited by: [§2.2](https://arxiv.org/html/2606.07219#S2.SS2.p2.1 "2.2 AI-Generated Content in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   G. Bao, Y. Zhao, Z. Teng, L. Yang, and Y. Zhang (2023)Fast-detectgpt: efficient zero-shot detection of machine-generated text via conditional probability curvature. In The Twelfth International Conference on Learning Representations, Cited by: [§4.1](https://arxiv.org/html/2606.07219#S4.SS1.p2.1 "4.1 Training-Free Detectors ‣ 4 Detection Models ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   J. Baumgartner, S. Zannettou, B. Keegan, M. Squire, and J. Blackburn (2020)The pushshift reddit dataset. Proceedings of the International AAAI Conference on Web and Social Media 14 (1),  pp.830–839. External Links: [Link](https://ojs.aaai.org/index.php/ICWSM/article/view/7347), [Document](https://dx.doi.org/10.1609/icwsm.v14i1.7347)Cited by: [§3.1](https://arxiv.org/html/2606.07219#S3.SS1.p2.1 "3.1 Data Collection ‣ 3 Data ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   F. Benevenuto, G. Magno, T. Rodrigues, and V. A. F. Almeida (2010)Detecting spammers on twitter. In Proceedings of the 7th Annual Collaboration, Electronic Messaging, Anti-Abuse and Spam Conference (CEAS), External Links: [Link](https://homepages.dcc.ufmg.br/%CB%9Cfabricio/download/ceas10.pdf)Cited by: [§2.1](https://arxiv.org/html/2606.07219#S2.SS1.p1.1 "2.1 Automated Behavior in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   T. B. Brown, B. Mann, N. Ryder, M. Subbiah, J. Kaplan, P. Dhariwal, A. Neelakantan, P. Shyam, G. Sastry, A. Askell, S. Agarwal, A. Herbert-Voss, G. Krueger, T. Henighan, R. Child, A. Ramesh, D. M. Ziegler, J. Wu, C. Winter, C. Hesse, M. Chen, E. Sigler, M. Litwin, S. Gray, B. Chess, J. Clark, C. Berner, S. McCandlish, A. Radford, I. Sutskever, and D. Amodei (2020)Language models are few-shot learners. In Proceedings of the 34th International Conference on Neural Information Processing Systems, Red Hook, NY, USA. External Links: ISBN 9781713829546 Cited by: [§2.2](https://arxiv.org/html/2606.07219#S2.SS2.p1.1 "2.2 AI-Generated Content in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   S. Chakraborty, A. Bedi, S. Zhu, B. An, D. Manocha, and F. Huang (2024)Position: on the possibilities of AI-generated text detection. In Proceedings of the 41st ICML, R. Salakhutdinov, Z. Kolter, K. Heller, A. Weller, N. Oliver, J. Scarlett, and F. Berkenkamp (Eds.), Vol. 235,  pp.6093–6115. External Links: [Link](https://proceedings.mlr.press/v235/chakraborty24a.html)Cited by: [§1](https://arxiv.org/html/2606.07219#S1.p3.1 "1 Introduction ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   J. P. Chang, C. Chiam, L. Fu, A. Wang, J. Zhang, and C. Danescu-Niculescu-Mizil (2020)ConvoKit: a toolkit for the analysis of conversations. In Proceedings of the 21th Annual Meeting of the Special Interest Group on Discourse and Dialogue, O. Pietquin, S. Muresan, V. Chen, C. Kennington, D. Vandyke, N. Dethlefs, K. Inoue, E. Ekstedt, and S. Ultes (Eds.), 1st virtual meeting,  pp.57–60. External Links: [Link](https://aclanthology.org/2020.sigdial-1.8/), [Document](https://dx.doi.org/10.18653/v1/2020.sigdial-1.8)Cited by: [§3.1](https://arxiv.org/html/2606.07219#S3.SS1.p2.1 "3.1 Data Collection ‣ 3 Data ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   Z. Chu, S. Gianvecchio, H. Wang, and S. Jajodia (2012)Detecting automation of twitter accounts: are you a human, bot, or cyborg?. 9 (6),  pp.811–824. External Links: [Document](https://dx.doi.org/10.1109/TDSC.2012.75)Cited by: [§2.1](https://arxiv.org/html/2606.07219#S2.SS1.p2.1 "2.1 Automated Behavior in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   A. Conneau, K. Khandelwal, N. Goyal, V. Chaudhary, G. Wenzek, F. Guzmán, E. Grave, M. Ott, L. Zettlemoyer, and V. Stoyanov (2020)Unsupervised cross-lingual representation learning at scale. In Proceedings of the 58th Annual Meeting of the Association for Computational Linguistics, D. Jurafsky, J. Chai, N. Schluter, and J. Tetreault (Eds.), Online,  pp.8440–8451. External Links: [Link](https://aclanthology.org/2020.acl-main.747/), [Document](https://dx.doi.org/10.18653/v1/2020.acl-main.747)Cited by: [§A.1](https://arxiv.org/html/2606.07219#A1.SS1.p2.1 "A.1 Model Hyperparameters ‣ Appendix A Additional Modeling Details ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   E. N. Crothers, N. Japkowicz, and H. L. Viktor (2023)Machine-generated text: a comprehensive survey of threat models and detection methods. 11 (),  pp.70977–71002. External Links: [Document](https://dx.doi.org/10.1109/ACCESS.2023.3294090)Cited by: [§2.2](https://arxiv.org/html/2606.07219#S2.SS2.p3.1 "2.2 AI-Generated Content in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   D. Das, K. D. Langis, A. Martin-Boyle, J. Kim, M. Lee, Z. M. Kim, S. A. Hayati, R. Owan, B. Hu, R. Parkar, R. Koo, J. Park, A. Tyagi, L. Ferland, S. Roy, V. Liu, and D. Kang (2024)Under the surface: tracking the artifactuality of llm-generated data. External Links: 2401.14698, [Link](https://arxiv.org/abs/2401.14698)Cited by: [§3.4](https://arxiv.org/html/2606.07219#S3.SS4.p1.1 "3.4 Data Postprocessing ‣ 3 Data ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   C. A. Davis, O. Varol, E. Ferrara, A. Flammini, and F. Menczer (2016)BotOrNot: a system to evaluate social bots. In Proceedings of the 25th International Conference Companion on World Wide Web, Republic and Canton of Geneva, CHE,  pp.273–274. External Links: ISBN 9781450341448, [Link](https://doi.org/10.1145/2872518.2889302), [Document](https://dx.doi.org/10.1145/2872518.2889302)Cited by: [§2.1](https://arxiv.org/html/2606.07219#S2.SS1.p3.1 "2.1 Automated Behavior in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   J. Devlin, M. Chang, K. Lee, and K. Toutanova (2019)BERT: pre-training of deep bidirectional transformers for language understanding. In Proceedings of the 2019 Conference of the North American Chapter of the Association for Computational Linguistics: Human Language Technologies, Volume 1 (Long and Short Papers), J. Burstein, C. Doran, and T. Solorio (Eds.), Minneapolis, Minnesota,  pp.4171–4186. External Links: [Link](https://aclanthology.org/N19-1423/), [Document](https://dx.doi.org/10.18653/v1/N19-1423)Cited by: [§A.1](https://arxiv.org/html/2606.07219#A1.SS1.p2.1 "A.1 Model Hyperparameters ‣ Appendix A Additional Modeling Details ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   A. V. Dorogush, A. Gulin, G. Gusev, N. Kazeev, L. O. Prokhorenkova, and A. Vorobev (2017)Fighting biases with dynamic boosting. abs/1706.09516. External Links: [Link](http://arxiv.org/abs/1706.09516), 1706.09516 Cited by: [§4.2](https://arxiv.org/html/2606.07219#S4.SS2.p2.1 "4.2 Training-Based Detectors ‣ 4 Detection Models ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   B. Efron and R.J. Tibshirani (1994)An introduction to the bootstrap. 1st Edition edition, Chapman and Hall/CRC, New York. External Links: [Document](https://dx.doi.org/10.1201/9780429246593), ISBN 9780429246593, [Link](https://doi.org/10.1201/9780429246593)Cited by: [Appendix B](https://arxiv.org/html/2606.07219#A2.p1.2 "Appendix B Confidence Intervals ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   E. Ferrara, O. Varol, C. Davis, F. Menczer, and A. Flammini (2016)The rise of social bots. 59 (7),  pp.96–104. External Links: [Document](https://dx.doi.org/10.1145/2818717), [Link](http://dx.doi.org/10.1145/2818717)Cited by: [§1](https://arxiv.org/html/2606.07219#S1.p1.1 "1 Introduction ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"), [§2.1](https://arxiv.org/html/2606.07219#S2.SS1.p1.1 "2.1 Automated Behavior in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   E. Ferrara (2024)GenAI against humanity: nefarious applications of generative artificial intelligence and large language models. 7 (1),  pp.549–569. External Links: ISSN 2432-2725, [Link](http://dx.doi.org/10.1007/s42001-024-00250-1), [Document](https://dx.doi.org/10.1007/s42001-024-00250-1)Cited by: [§2.1](https://arxiv.org/html/2606.07219#S2.SS1.p4.1 "2.1 Automated Behavior in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   A. Fiedler and J. Döpke (2025)Do humans identify ai-generated text better than machines? evidence based on excerpts from german theses. 49,  pp.100321. External Links: ISSN 1477-3880, [Document](https://dx.doi.org/https%3A//doi.org/10.1016/j.iree.2025.100321), [Link](https://www.sciencedirect.com/science/article/pii/S1477388025000131)Cited by: [§1](https://arxiv.org/html/2606.07219#S1.p2.1 "1 Introduction ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   A. Hans, A. Schwarzschild, V. Cherepanova, H. Kazemi, A. Saha, M. Goldblum, J. Geiping, and T. Goldstein (2024)Spotting llms with binoculars: zero-shot detection of machine-generated text. In Proceedings of the 41st ICML, Cited by: [§1](https://arxiv.org/html/2606.07219#S1.p2.1 "1 Introduction ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"), [§4.1](https://arxiv.org/html/2606.07219#S4.SS1.p1.1 "4.1 Training-Free Detectors ‣ 4 Detection Models ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"), [§4.1](https://arxiv.org/html/2606.07219#S4.SS1.p2.1 "4.1 Training-Free Detectors ‣ 4 Detection Models ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   X. He, X. Shen, Z. Chen, M. Backes, and Y. Zhang (2024)MGTBench: Benchmarking Machine-Generated Text Detection. In ACM SIGSAC Conference on Computer and Communications Security (CCS), Cited by: [§2.2](https://arxiv.org/html/2606.07219#S2.SS2.p3.1 "2.2 AI-Generated Content in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   E. J. Hu, yelong shen, P. Wallis, Z. Allen-Zhu, Y. Li, S. Wang, L. Wang, and W. Chen (2022)LoRA: low-rank adaptation of large language models. In International Conference on Learning Representations, External Links: [Link](https://openreview.net/forum?id=nZeVKeeFYf9)Cited by: [§A.1](https://arxiv.org/html/2606.07219#A1.SS1.p3.5 "A.1 Model Hyperparameters ‣ Appendix A Additional Modeling Details ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   O. Ignat, X. Xu, and R. Mihalcea (2025)MAiDE-up: multilingual deception detection of AI-generated hotel reviews. In Findings of the Association for Computational Linguistics: NAACL 2025, L. Chiruzzo, A. Ritter, and L. Wang (Eds.), Albuquerque, New Mexico,  pp.1636–1653. External Links: [Link](https://aclanthology.org/2025.findings-naacl.88/), [Document](https://dx.doi.org/10.18653/v1/2025.findings-naacl.88), ISBN 979-8-89176-195-7 Cited by: [§2.2](https://arxiv.org/html/2606.07219#S2.SS2.p3.1 "2.2 AI-Generated Content in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   J. Kirchenbauer, J. Geiping, Y. Wen, J. Katz, I. Miers, and T. Goldstein (2023)A watermark for large language models. In Proceedings of the 40th ICML, A. Krause, E. Brunskill, K. Cho, B. Engelhardt, S. Sabato, and J. Scarlett (Eds.), Vol. 202,  pp.17061–17084. External Links: [Link](https://proceedings.mlr.press/v202/kirchenbauer23a.html)Cited by: [§1](https://arxiv.org/html/2606.07219#S1.p2.1 "1 Introduction ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   P. Koncar, S. Walk, and D. Helic (2021)Analysis and prediction of multilingual controversy on reddit. In Proceedings of the 13th ACM Web Science Conference 2021, New York, NY, USA,  pp.215–224. External Links: ISBN 9781450383301, [Link](https://doi.org/10.1145/3447535.3462481), [Document](https://dx.doi.org/10.1145/3447535.3462481)Cited by: [§3.1](https://arxiv.org/html/2606.07219#S3.SS1.p2.1 "3.1 Data Collection ‣ 3 Data ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   M. La Morgia, A. Mei, and A. M. Mongardini (2025)TGDataset: collecting and exploring the largest telegram channels dataset. In Proceedings of KDD ’25, New York, NY, USA,  pp.2325–2334. External Links: ISBN 9798400712456, [Link](https://doi.org/10.1145/3690624.3709397), [Document](https://dx.doi.org/10.1145/3690624.3709397)Cited by: [§3.2](https://arxiv.org/html/2606.07219#S3.SS2.p1.1 "3.2 Data Processing ‣ 3 Data ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   B. W. Lee and J. Lee (2023)LFTK: handcrafted features in computational linguistics. In Proceedings of the 18th Workshop on Innovative Use of NLP for Building Educational Applications (BEA 2023), E. Kochmar, J. Burstein, A. Horbach, R. Laarmann-Quante, N. Madnani, A. Tack, V. Yaneva, Z. Yuan, and T. Zesch (Eds.), Toronto, Canada,  pp.1–19. External Links: [Link](https://aclanthology.org/2023.bea-1.1/), [Document](https://dx.doi.org/10.18653/v1/2023.bea-1.1)Cited by: [§4.2](https://arxiv.org/html/2606.07219#S4.SS2.p2.1 "4.2 Training-Based Detectors ‣ 4 Detection Models ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   D. Macko, J. Kopál, R. Moro, and I. Srba (2025)MultiSocial: multilingual benchmark of machine-generated text detection of social-media texts. In Proceedings of the 63rd Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers), W. Che, J. Nabende, E. Shutova, and M. T. Pilehvar (Eds.), Vienna, Austria,  pp.727–752. External Links: [Link](https://aclanthology.org/2025.acl-long.36/), [Document](https://dx.doi.org/10.18653/v1/2025.acl-long.36), ISBN 979-8-89176-251-0 Cited by: [§1](https://arxiv.org/html/2606.07219#S1.p3.1 "1 Introduction ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"), [§2.2](https://arxiv.org/html/2606.07219#S2.SS2.p4.1 "2.2 AI-Generated Content in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"), [§4.2](https://arxiv.org/html/2606.07219#S4.SS2.p1.1 "4.2 Training-Based Detectors ‣ 4 Detection Models ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   D. Macko, R. Moro, A. Uchendu, J. Lucas, M. Yamashita, M. Pikuliak, I. Srba, T. Le, D. Lee, J. Simko, and M. Bielikova (2023)MULTITuDE: large-scale multilingual machine-generated text detection benchmark. In Proceedings of the 2023 Conference on Empirical Methods in Natural Language Processing,  pp.9960–9987. External Links: [Link](http://dx.doi.org/10.18653/v1/2023.emnlp-main.616), [Document](https://dx.doi.org/10.18653/v1/2023.emnlp-main.616)Cited by: [§2.2](https://arxiv.org/html/2606.07219#S2.SS2.p3.1 "2.2 AI-Generated Content in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   M. Malik, J. Jiang, and K. M. A. Chai (2024)An empirical analysis of the writing styles of persona-assigned LLMs. In Proceedings of the 2024 Conference on Empirical Methods in Natural Language Processing, Y. Al-Onaizan, M. Bansal, and Y. Chen (Eds.), Miami, Florida, USA,  pp.19369–19388. External Links: [Link](https://aclanthology.org/2024.emnlp-main.1079/), [Document](https://dx.doi.org/10.18653/v1/2024.emnlp-main.1079)Cited by: [§2.2](https://arxiv.org/html/2606.07219#S2.SS2.p2.1 "2.2 AI-Generated Content in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"), [§3.3](https://arxiv.org/html/2606.07219#S3.SS3.p4.1 "3.3 Generation Pipeline ‣ 3 Data ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   M. Mozes, X. He, B. Kleinberg, and L. D. Griffin (2023)Use of llms for illicit purposes: threats, prevention measures, and vulnerabilities. External Links: 2308.12833, [Link](https://arxiv.org/abs/2308.12833)Cited by: [§1](https://arxiv.org/html/2606.07219#S1.p1.1 "1 Introduction ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   L. H. X. Ng and K. M. Carley (2025)A global comparison of social media bot and human characteristics. 15. External Links: [Link](https://api.semanticscholar.org/CorpusID:277464933)Cited by: [§2.1](https://arxiv.org/html/2606.07219#S2.SS1.p2.1 "2.1 Automated Behavior in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   M. T. Ng, H. T. Tse, J. Huang, J. Li, W. Wang, and M. R. Lyu (2024)How well can llms echo us? evaluating ai chatbots’ role-play ability with echo. External Links: 2404.13957, [Link](https://arxiv.org/abs/2404.13957)Cited by: [§3.3](https://arxiv.org/html/2606.07219#S3.SS3.p4.1 "3.3 Generation Pipeline ‣ 3 Data ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   G. Quaremba, E. Black, D. Vrandecic, and E. Simperl (2025)WETBench: a benchmark for detecting task-specific machine-generated text on Wikipedia. In Proceedings of the 2nd Workshop on Advancing Natural Language Processing for Wikipedia (WikiNLP 2025), A. Arora, I. Johnson, L. Kaffee, T. Kuo, T. Piccardi, and I. Sen (Eds.), Vienna, Austria,  pp.10–30. External Links: [Link](https://aclanthology.org/2025.wikinlp-1.6/), [Document](https://dx.doi.org/10.18653/v1/2025.wikinlp-1.6), ISBN 979-8-89176-284-8 Cited by: [§4.1](https://arxiv.org/html/2606.07219#S4.SS1.p2.1 "4.1 Training-Free Detectors ‣ 4 Detection Models ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   V. S. Sadasivan, A. Kumar, S. Balasubramanian, W. Wang, and S. Feizi (2024)Can ai-generated text be reliably detected?. External Links: 2303.11156, [Link](https://arxiv.org/abs/2303.11156)Cited by: [§1](https://arxiv.org/html/2606.07219#S1.p2.1 "1 Introduction ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   D. T. Schroeder, M. Cha, A. Baronchelli, N. Bostrom, N. Christakis, D. Garcia, A. Goldenberg, Y. Kyrychenko, K. Leyton-Brown, N. Lutz, G. Marcus, F. Menczer, G. Pennycook, D. Rand, F. Schweitzer, C. Summerfield, A. Tang, J. J. Van Bavel, S. van der Linden, D. Song, and J. R. Kunst (2026)How Malicious AI Swarms Can Threaten Democracy. Science 391 (6783),  pp.354–357. External Links: [Document](https://dx.doi.org/10.1126/science.adz1697), [Link](https://doi.org/10.1126/science.adz1697)Cited by: [§1](https://arxiv.org/html/2606.07219#S1.p1.1 "1 Introduction ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   C. Shao, G. L. Ciampaglia, O. Varol, K. Yang, A. Flammini, and F. Menczer (2018)The spread of low-credibility content by social bots. Nature Communications 9,  pp.4787. External Links: [Document](https://dx.doi.org/10.1038/s41467-018-06930-7), [Link](https://doi.org/10.1038/s41467-018-06930-7)Cited by: [§2.1](https://arxiv.org/html/2606.07219#S2.SS1.p1.1 "2.1 Automated Behavior in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   Q. Shi, C. E. Jimenez, S. Dong, B. Seo, C. Yao, A. Kelch, and K. R. Narasimhan (2025)IMPersona: evaluating individual level LLM impersonation. In Second Conference on Language Modeling, External Links: [Link](https://openreview.net/forum?id=7qhBXq0NLN)Cited by: [§6.1](https://arxiv.org/html/2606.07219#S6.SS1.p1.1 "6.1 Limitations ‣ 6 Conclusions ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"), [§6.3](https://arxiv.org/html/2606.07219#S6.SS3.p1.1 "6.3 Future Work ‣ 6 Conclusions ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   Z. Sun, Z. Zhang, X. Shen, Z. Zhang, Y. Liu, M. Backes, Y. Zhang, and X. He (2025)Are we in the AI-generated text world already? quantifying and monitoring AIGT on social media. In Proceedings of the 63rd Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers), W. Che, J. Nabende, E. Shutova, and M. T. Pilehvar (Eds.), Vienna, Austria,  pp.22975–23005. External Links: [Link](https://aclanthology.org/2025.acl-long.1120/), [Document](https://dx.doi.org/10.18653/v1/2025.acl-long.1120), ISBN 979-8-89176-251-0 Cited by: [§2.2](https://arxiv.org/html/2606.07219#S2.SS2.p2.1 "2.2 AI-Generated Content in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"), [§2.2](https://arxiv.org/html/2606.07219#S2.SS2.p4.1 "2.2 AI-Generated Content in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"), [§5.1](https://arxiv.org/html/2606.07219#S5.SS1.p1.1 "5.1 AI-generated Text Detection ‣ 5 Results ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   R. Tang, Y. Chuang, and X. Hu (2024)The science of detecting llm-generated text. 67 (4),  pp.50–59. External Links: ISSN 0001-0782, [Link](https://doi.org/10.1145/3624725), [Document](https://dx.doi.org/10.1145/3624725)Cited by: [§2.2](https://arxiv.org/html/2606.07219#S2.SS2.p1.1 "2.2 AI-Generated Content in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   O. Varol, E. Ferrara, C. Davis, F. Menczer, and A. Flammini (2017)Online human-bot interactions: detection, estimation, and characterization. 11 (1),  pp.280–289. External Links: [Link](https://ojs.aaai.org/index.php/ICWSM/article/view/14871), [Document](https://dx.doi.org/10.1609/icwsm.v11i1.14871)Cited by: [§2.1](https://arxiv.org/html/2606.07219#S2.SS1.p2.1 "2.1 Automated Behavior in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   Y. Wang, J. Mansurov, P. Ivanov, J. Su, A. Shelmanov, A. Tsvigun, O. Mohammed Afzal, T. Mahmoud, G. Puccetti, T. Arnold, A. Aji, N. Habash, I. Gurevych, and P. Nakov (2024a)M4GT-bench: evaluation benchmark for black-box machine-generated text detection. In Proceedings of the 62nd Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers), L. Ku, A. Martins, and V. Srikumar (Eds.), Bangkok, Thailand,  pp.3964–3992. External Links: [Link](https://aclanthology.org/2024.acl-long.218/), [Document](https://dx.doi.org/10.18653/v1/2024.acl-long.218)Cited by: [§2.2](https://arxiv.org/html/2606.07219#S2.SS2.p3.1 "2.2 AI-Generated Content in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   Y. Wang, J. Mansurov, P. Ivanov, J. Su, A. Shelmanov, A. Tsvigun, C. Whitehouse, O. Mohammed Afzal, T. Mahmoud, T. Sasaki, T. Arnold, A. F. Aji, N. Habash, I. Gurevych, and P. Nakov (2024b)M4: multi-generator, multi-domain, and multi-lingual black-box machine-generated text detection. In Proceedings of the 18th Conference of the European Chapter of the Association for Computational Linguistics (Volume 1: Long Papers), Y. Graham and M. Purver (Eds.), St. Julian’s, Malta,  pp.1369–1407. External Links: [Link](https://aclanthology.org/2024.eacl-long.83/), [Document](https://dx.doi.org/10.18653/v1/2024.eacl-long.83)Cited by: [§1](https://arxiv.org/html/2606.07219#S1.p2.1 "1 Introduction ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   L. Weidinger, J. Uesato, M. Rauh, C. Griffin, P. Huang, J. Mellor, A. Glaese, M. Cheng, B. Balle, A. Kasirzadeh, C. Biles, S. Brown, Z. Kenton, W. Hawkins, T. Stepleton, A. Birhane, L. A. Hendricks, L. Rimell, W. Isaac, J. Haas, S. Legassick, G. Irving, and I. Gabriel (2022)Taxonomy of risks posed by language models. In Proceedings of the 2022 ACM Conference on Fairness, Accountability, and Transparency,  pp.214–229. External Links: ISBN 9781450393522, [Link](https://doi.org/10.1145/3531146.3533088), [Document](https://dx.doi.org/10.1145/3531146.3533088)Cited by: [§2.2](https://arxiv.org/html/2606.07219#S2.SS2.p3.1 "2.2 AI-Generated Content in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   T. Wolf, L. Debut, V. Sanh, J. Chaumond, C. Delangue, A. Moi, P. Cistac, T. Rault, R. Louf, M. Funtowicz, J. Davison, S. Shleifer, P. von Platen, C. Ma, Y. Jernite, J. Plu, C. Xu, T. Le Scao, S. Gugger, M. Drame, Q. Lhoest, and A. Rush (2020)Transformers: state-of-the-art natural language processing. In Proceedings of the 2020 Conference on Empirical Methods in Natural Language Processing: System Demonstrations, Q. Liu and D. Schlangen (Eds.), Online,  pp.38–45. External Links: [Link](https://aclanthology.org/2020.emnlp-demos.6/), [Document](https://dx.doi.org/10.18653/v1/2020.emnlp-demos.6)Cited by: [§2.2](https://arxiv.org/html/2606.07219#S2.SS2.p1.1 "2.2 AI-Generated Content in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   J. Wu, S. Yang, R. Zhan, Y. Yuan, L. S. Chao, and D. F. Wong (2025a)A survey on llm-generated text detection: necessity, methods, and future directions. Computational Linguistics 51 (1),  pp.275–338. External Links: ISSN 0891-2017, [Document](https://dx.doi.org/10.1162/coli%5Fa%5F00549), [Link](https://doi.org/10.1162/coli_a_00549), https://direct.mit.edu/coli/article-pdf/51/1/275/2497295/coli_a_00549.pdf Cited by: [§4.1](https://arxiv.org/html/2606.07219#S4.SS1.p1.1 "4.1 Training-Free Detectors ‣ 4 Detection Models ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   J. Wu, R. Zhan, D. F. Wong, S. Yang, X. Liu, L. S. Chao, and M. Zhang (2025b)Who wrote this? the key to zero-shot LLM-generated text detection is GECScore. In Proceedings of the 31st International Conference on Computational Linguistics, O. Rambow, L. Wanner, M. Apidianaki, H. Al-Khalifa, B. D. Eugenio, and S. Schockaert (Eds.), Abu Dhabi, UAE,  pp.10275–10292. External Links: [Link](https://aclanthology.org/2025.coling-main.684/)Cited by: [§4.1](https://arxiv.org/html/2606.07219#S4.SS1.p2.1 "4.1 Training-Free Detectors ‣ 4 Detection Models ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   K. Yang, E. Ferrara, and F. Menczer (2022)Botometer 101: social bot practicum for computational social scientists. 5,  pp.1511–1528. External Links: [Document](https://dx.doi.org/10.1007/s42001-022-00177-5), [Link](https://doi.org/10.1007/s42001-022-00177-5)Cited by: [§1](https://arxiv.org/html/2606.07219#S1.p1.1 "1 Introduction ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"), [§2.1](https://arxiv.org/html/2606.07219#S2.SS1.p3.1 "2.1 Automated Behavior in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"), [§6.3](https://arxiv.org/html/2606.07219#S6.SS3.p2.1 "6.3 Future Work ‣ 6 Conclusions ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   K. Yang and F. Menczer (2024)Anatomy of an ai-powered malicious social botnet. 4. External Links: ISSN 2673-8813, [Link](http://dx.doi.org/10.51685/jqd.2024.icwsm.7), [Document](https://dx.doi.org/10.51685/jqd.2024.icwsm.7)Cited by: [§1](https://arxiv.org/html/2606.07219#S1.p1.1 "1 Introduction ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"), [§2.1](https://arxiv.org/html/2606.07219#S2.SS1.p4.1 "2.1 Automated Behavior in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"), [§2.2](https://arxiv.org/html/2606.07219#S2.SS2.p5.1 "2.2 AI-Generated Content in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   K. Yang, D. Singh, and F. Menczer (2024a)Characteristics and prevalence of fake social media profiles with ai-generated faces. Journal of Online Trust and Safety 2 (4). External Links: [Document](https://dx.doi.org/10.54501/jots.v2i4.197), [Link](https://doi.org/10.54501/jots.v2i4.197)Cited by: [§2.2](https://arxiv.org/html/2606.07219#S2.SS2.p3.1 "2.2 AI-Generated Content in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   K. Yang, O. Varol, C. A. Davis, E. Ferrara, A. Flammini, and F. Menczer (2019)Arming the public with artificial intelligence to counter social bots. 1 (1),  pp.48–61. External Links: [Document](https://dx.doi.org/https%3A//doi.org/10.1002/hbe2.115), [Link](https://onlinelibrary.wiley.com/doi/abs/10.1002/hbe2.115), https://onlinelibrary.wiley.com/doi/pdf/10.1002/hbe2.115 Cited by: [§2.1](https://arxiv.org/html/2606.07219#S2.SS1.p3.1 "2.1 Automated Behavior in Social Media ‣ 2 Related Work ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   K. Yang, O. Varol, A. C. Nwala, M. Sayyadiharikandeh, E. Ferrara, A. Flammini, and F. Menczer (2025)Social bots: detection and challenges. In Handbook of Computational Social Science, T. Yasseri (Ed.),  pp.473–491. External Links: [Document](https://dx.doi.org/10.4337/9781802207309.00049), [Link](https://www.elgaronline.com/edcollchap/book/9781802207309/chapter33.xml)Cited by: [§1](https://arxiv.org/html/2606.07219#S1.p1.1 "1 Introduction ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"), [§6.3](https://arxiv.org/html/2606.07219#S6.SS3.p2.1 "6.3 Future Work ‣ 6 Conclusions ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 
*   X. Yang, L. Pan, X. Zhao, H. Chen, L. R. Petzold, W. Y. Wang, and W. Cheng (2024b)A survey on detection of LLMs-generated content. In Findings of the Association for Computational Linguistics: EMNLP 2024, Y. Al-Onaizan, M. Bansal, and Y. Chen (Eds.), Miami, Florida, USA,  pp.9786–9805. External Links: [Link](https://aclanthology.org/2024.findings-emnlp.572/), [Document](https://dx.doi.org/10.18653/v1/2024.findings-emnlp.572)Cited by: [§4](https://arxiv.org/html/2606.07219#S4.p1.1 "4 Detection Models ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). 

## Appendix A Additional Modeling Details

### A.1 Model Hyperparameters

For the linguistic features classifier (LFC), we use the LFTK tool to extract general, language-agnostic features. In particular, we use language-specific SpaCy 14 14 14[https://spacy.io/](https://spacy.io/) models for languages where they are available. Additionally, we add the detected language as a categorical feature. Later, we use these features to train a CatBoost classification model. Parameters used for training are 5,000 iterations, a 0.01 learning rate, and 500 early stopping rounds based on the accuracy metric on the validation subset.

For the Transformer-based classifier (TC), we experiment with two pretrained base models: mBERT (0.18B parameters) and XLM-RoBERTa (0.28B parameters)Conneau et al. ([2020](https://arxiv.org/html/2606.07219#bib.bib32 "Unsupervised cross-lingual representation learning at scale")); Devlin et al. ([2019](https://arxiv.org/html/2606.07219#bib.bib33 "BERT: pre-training of deep bidirectional transformers for language understanding")). Both were selected for their multilingual pretraining, which we expect to be beneficial given the nature of the task, while remaining computationally lightweight. We fine-tune each model for binary classification over three epochs, using a batch size of 64, a learning rate of 2\times 10^{-5}, and a weight decay of 0.01. The final checkpoint is selected based on the best accuracy achieved on the validation set during training.

For the Gemma-based TC (1B parameters), a decoder-only model fine-tuned with LoRA (r{=}16, \alpha{=}32, dropout=0.1) targeting query and value projections Hu et al. ([2022](https://arxiv.org/html/2606.07219#bib.bib66 "LoRA: low-rank adaptation of large language models")). We train for one epoch with a learning rate of 2{\times}10^{-4}, effective batch size of 64 (4{\times}16 accumulation steps), and weight decay of 0.01. After training, LoRA weights are merged into the base model for inference.

### A.2 Computational Resources

All experiments were done on a computational instance powered by a single NVIDIA GB10 Grace Blackwell chip. The experimental environment was based on the NVIDIA container image for PyTorch, Release 25.11. In total, approximately 100 GPU hours are required to reproduce the results reported in this paper, excluding the data generation stage, which relies on external API calls.

## Appendix B Confidence Intervals

We estimate the confidence intervals for the calculated metrics using bootstrapping Efron and Tibshirani ([1994](https://arxiv.org/html/2606.07219#bib.bib34 "An introduction to the bootstrap")). Specifically, we resample 1,000 times by drawing samples of size N with replacement from the testing set, where N is the total number of items in the set (capped at 10,000). We report two standard deviations as the 95% confidence interval (CI).

## Appendix C Data Generation Details

We use an OpenAI model solely for persona generation. This is not a key component in the pipeline and can be replaced with other methods, such as manually created personas. The full prompt template used for persona generation is shown in Listing[2](https://arxiv.org/html/2606.07219#LST2 "Listing 2 ‣ Appendix C Data Generation Details ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content"). We use structured output functionality to ensure a unified persona definition within the dataset. In particular, we extract a brief user description, the languages used, and a list of topics with positive and negative attitudes.

For the final content generation, we use Together.ai as the inference provider for open-source LLMs. In particular, we use two models from different providers and of different sizes. We generate messages in two modes: with and without conversational context. The full prompt templates used for message generation are shown in Listings[3](https://arxiv.org/html/2606.07219#LST3 "Listing 3 ‣ Appendix C Data Generation Details ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content") and[4](https://arxiv.org/html/2606.07219#LST4 "Listing 4 ‣ Appendix C Data Generation Details ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content").

The prompt used for GECScore calculation is presented in Listing[1](https://arxiv.org/html/2606.07219#LST1 "Listing 1 ‣ Appendix C Data Generation Details ‣ Adversarial Creation and Detection of AI-Generated Social Bot Content").

The parameters used for each model are listed below (all parameters not mentioned were left at their default values):

*   •
openai/gpt-oss-20b: temperature=1

*   •
Gemma-3n-E4B: max_tokens=2000, temperature=0.5, random_seed=42

*   •
Qwen3-235B-A22B: max_tokens=2000, temperature=0.5, random_seed=42

Listing 1: Prompt for GECScore calculation.

You are a highly skilled grammar correction AI in multiple languages.You are provided with a text separated by<text></text>tags.Correct any grammatical,spelling,or punctuation errors in the text,doing only minimal changes necessary.Return ONLY the corrected text without any additional commentary.

#Text to correct:

<text>{text}</text>

Listing 2: Prompt template used for user persona generation.

You’re an expert in analyzing social media conversations and defining the persona of[USER]based on its interactions.

You will be provided with a set of user interactions in form of conversation under the post,where the user has taken part in([CONVERSATIONS]).

You need to generate a persona JSON for the user based on the provided interactions.

Pay special attention to users stance to different topics.

The persona JSON should strictly follow the following template:{template_string}

Return ONLY a valid JSON object with exactly these keys:

"description","languages","positive_sentiment_topics","negative_sentiment_topics".

Do not include any explanation or markdown-raw JSON only.

Our target[USER]has ID={anonymized user_id}.

[CONVERSATIONS]{random user threads}

Listing 3: Prompt template used to generate a user message in a given context. This prompt utilizes conversational context that refers to the set of similar previous threads in which the user has participated.

You are an expert in imitating the user(USER_ID={anonymized user_id})style in social media communication.

You are provided:

-[USER_PERSONA]Characteristics of user usual communication style.

-[PREVIOUS CONVERSATIONS]User previous conversations.

-[CURRENT CONTEXT]The current conversation thread where you should write a message on behalf of the user(USER_ID={anonymized user_id})

Your task is to imitate the user(USER_ID={anonymized user_id})and generate the most likely text the user would write in the[CURRENT CONTEXT].Reproduce from the[PREVIOUS CONVERSATIONS]user’s(USER_ID={anonymized user_id})tone characteristics,tendency to jokes,reacting to posts,etc.

[USER PERSONA]:{generated user persona}[PREVIOUS CONVERSATIONS]:{user previous conversations}[CURRENT CONTEXT]:{current thread}

[LENGTH CONSTRAINTS]The response should be strictly around{number of words in real message}words.

[STYLE CONSTRAINTS]:

-No Unicode punctuation.Do not beautify or autocorrect.

-You should imitate the user’s(USER_ID={anonymized user_id})style as closely as possible.

-Use the same language as the user(USER_ID={anonymized user_id})in the[PREVIOUS CONVERSATIONS].

-Output must strictly preserve raw formatting style from[PREVIOUS CONVERSATIONS].

-Your response should naturally pick up the conversation from the message with ID{id of the previous message in the thread}within the[CURRENT CONTEXT].

[OUTPUT FORMAT]You should return only the response text(your message in thread).Nothing else.Ensure the text style is consistent with user persona."

Listing 4: Prompt template used to generate a user message in a given context. This prompt does not utilize conversational context.

You are an expert in imitating the user(USER_ID={anonymized user_id})style in social media communication.

You are provided:

-[USER_PERSONA]Characteristics of user usual communication style.

-[CURRENT CONTEXT]The current conversation thread where you should write a message on behalf of the user(USER_ID={anonymized user_id})

Your task is to imitate the user(USER_ID={anonymized user_id})and generate the most likely text the user would write in the[CURRENT CONTEXT].

[USER PERSONA]{generated user persona}

[CURRENT CONTEXT]:{current thread}

[LENGTH CONSTRAINTS]The response should be strictly around{number of words in real message}words.

[STYLE CONSTRAINTS]

-No Unicode punctuation.Do not beautify or autocorrect.

-You should imitate the user’s(USER_ID={anonymized user_id})style as closely as possible.

-Your response should naturally pick up the conversation from the message with ID{id of the previous message in the thread}within the[CURRENT CONTEXT].

[OUTPUT FORMAT]You should return only the response text(your message in thread).Nothing else.Ensure the text style is consistent with user persona."
