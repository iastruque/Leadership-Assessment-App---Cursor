export const getRecommendations = (dimensionId: string, score: number): string[] => {
    // Recommendations based on dimension and score
    const recommendationsByLevel: Record<string, Record<string, string[]>> = {
      raising_expectations: {
        low: [
          'Set clear, ambitious goals that challenge your team to exceed their limits',
          'Create an environment where rapid experimentation and challenging the status quo is encouraged',
          'Implement regular performance reviews that focus on raising standards and learning from experiments',
          'Balance high standards with recognition of progress and productive failures'
        ],
        medium: [
          'Calibrate your expectations to be challenging while encouraging experimentation',
          'Develop a system to recognize both achievement of standards and innovative approaches',
          'Involve the team in setting higher standards and defining excellence',
          'Create mechanisms to learn from high performance and rapid experimentation'
        ],
        high: [
          'Create a culture where continuously raising expectations and experimentation is the norm',
          'Develop other leaders to set high standards while promoting rapid prototyping',
          'Implement mechanisms to regularly review and raise performance standards',
          'Share best practices for excellence and experimentation across teams'
        ]
      },
      increasing_urgency: {
        low: [
          'Implement rapid decision-making processes and iteration cycles that accelerate execution',
          'Eliminate bureaucratic obstacles that slow progress and innovation',
          'Create shorter feedback loops to drive immediate improvement and learning',
          'Design clear priorities that focus energy on what matters most for speed'
        ],
        medium: [
          'Develop a system for prioritizing urgent tasks and accelerating iteration cycles',
          'Speed up feedback loops to quickly adjust execution and innovation',
          'Balance execution speed with quality of results and learning',
          'Create agile decision-making frameworks that empower teams to move faster'
        ],
        high: [
          'Create mechanisms to identify and resolve bottlenecks in execution and innovation cycles',
          'Develop team capability for rapid decision-making and immediate implementation',
          'Implement a system to measure and continuously improve execution speed',
          'Build a culture that values speed and iteration as competitive advantages'
        ]
      },
      intensifying_commitment: {
        low: [
          'Connect daily work to meaningful purposes and cost-effective innovation',
          'Generate higher energy levels through inspiring goals and visible progress',
          'Develop team rituals that maintain intensity and focus on outcomes while optimizing resources',
          'Create a sense of urgency around key priorities and efficient innovation'
        ],
        medium: [
          'Foster a sense of ownership for outcomes and resource-efficient solutions',
          'Implement mechanisms to maintain determination while pursuing cost-effective innovation',
          'Recognize and celebrate both commitment to goals and innovative resource utilization',
          'Develop strategies to maintain commitment while optimizing resources'
        ],
        high: [
          'Create a culture where intensity, outcome focus, and cost-effective innovation are core values',
          'Develop leaders who model high levels of commitment and resource efficiency',
          'Implement practices to prevent burnout while maintaining intensity and innovation',
          'Build systems for sustained commitment and continuous improvement with optimal resources'
        ]
      },
      transforming_conversations: {
        low: [
          'Implement Socratic questioning techniques that challenge established practices',
          'Foster constructive debates that rigorously test ideas and question assumptions',
          'Create a safe environment where challenging ideas and norms is encouraged',
          'Establish frameworks that promote intellectually intense collaboration and questioning'
        ],
        medium: [
          'Develop the ability to ask probing questions that challenge assumptions and established practices',
          'Implement structures for intellectually intense collaboration that questions the status quo',
          'Train the team in constructive debate and rigorous testing of ideas and norms',
          'Create collaborative spaces that encourage meaningful dialogue and questioning assumptions'
        ],
        high: [
          'Create a culture where transformative conversations and challenging norms are the norm',
          'Develop facilitators who can elevate dialogue quality and intellectual rigor',
          'Implement practices to convert deep conversations into concrete actions that challenge norms',
          'Build communication approaches that balance respect with intellectual challenge'
        ]
      },
      data_driven_leadership: {
        low: [
          'Establish clear metrics to measure progress and effectively leverage technology',
          'Implement data dashboards that inform decisions and technology adoption',
          'Develop the ability to interpret data and extract actionable insights',
          'Use data and commercial technology to guide decision-making and innovation'
        ],
        medium: [
          'Foster a culture where decisions are evidence-based and technology is effectively leveraged',
          'Implement processes to collect and analyze relevant data for decision-making',
          'Develop the ability to identify patterns in data that can inform technology adoption',
          'Create data-sharing protocols that support decision-making and innovation'
        ],
        high: [
          'Create advanced data analytics systems that inform strategy and technology adoption',
          'Develop the ability to use data to anticipate changes and innovation opportunities',
          'Implement practices that balance data-driven decisions with judgment when adopting technology',
          'Build data-informed innovation processes that effectively leverage commercial technology'
        ]
      }
    };
  
    // Determine level based on score
    let level: 'low' | 'medium' | 'high';
    if (score < 40) {
      level = 'low';
    } else if (score < 70) {
      level = 'medium';
    } else {
      level = 'high';
    }
  
    // Return corresponding recommendations
    return recommendationsByLevel[dimensionId]?.[level] || [
      'Work on improving this dimension by integrating "Amp It Up" and "The Geek Way" principles',
      'Raise expectations by setting higher standards and promoting rapid experimentation',
      'Increase urgency by accelerating decision-making and implementing rapid iteration cycles',
      'Intensify commitment by focusing on outcomes and cost-effective innovation',
      'Transform conversations by promoting intellectually intense discussions that challenge established practices',
      'Develop data-driven leadership that uses evidence and technology to guide decisions'
    ];
  };
  