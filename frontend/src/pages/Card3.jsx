import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Package, Droplet, Trash2, Clock, Lightbulb, CheckCircle } from 'lucide-react';
import '../styles/Card3.css';

const Card3 = () => {
  const [expandedCard, setExpandedCard] = useState(0);

  const cardData = [
    {
      id: 1,
      title: "What are Sanitary Napkins?",
      icon: <Package size={24} />,
      color: "card-indigo",
      content: "It's a strange term, but a 'sanitary napkin' or 'sanitary pad' just means an absorbent pad that you wear on your panties during your period in order to absorb menstrual blood. Sanitary napkins (or pads) come in a number of varieties and sizes. Depending on your menstrual flow and preference, you need to choose a sanitary napkin of appropriate thickness, length and absorbency.",
      keyPoints: [
        "Absorbent pads worn during periods",
        "Available in various sizes and thicknesses",
        "Choice depends on flow and preference",
        "Important for menstrual hygiene",
        "Come in different absorbency levels"
      ]
    },
    {
      id: 2,
      title: "How to Use Sanitary Napkins",
      icon: <CheckCircle size={24} />,
      color: "card-cyan",
      content: "Using a sanitary napkin is pretty easy. Here are a few basic steps on how to wear a sanitary napkin. Don't worry, after the first few times of trying to understand your body's response to periods, you will eventually settle on the right type of sanitary napkin for you.",
      steps: [
        {
          step: 1,
          title: "Remove the Paper",
          description: "Remove the paper on the back side of the pad and place it on your panty"
        },
        {
          step: 2,
          title: "Align the Pad",
          description: "Remove the paper from wings. Wrap the wings around both sides of the panty and press firmly"
        },
        {
          step: 3,
          title: "Secure Properly",
          description: "Make sure the pad is centered and wings are wrapped securely around the panty"
        },
        {
          step: 4,
          title: "Check Comfort",
          description: "Ensure the pad feels comfortable and is properly positioned"
        }
      ]
    },
    {
      id: 3,
      title: "How to Dispose of Sanitary Napkins",
      icon: <Trash2 size={24} />,
      color: "card-green",
      content: "Proper disposal of sanitary napkins is important for hygiene and environmental reasons. By following these steps for disposal, you can help waste collectors easily identify and segregate sanitary waste. This waste can now be handled in a hygienic manner and recycled to ensure minimal impact on the environment.",
      disposalSteps: [
        {
          step: 1,
          title: "Remove the Pad",
          description: "Remove the paper on the back side of the pad and place it on your panty"
        },
        {
          step: 2,
          title: "Wrap the Pad",
          description: "Remove the paper from wings. Wrap the wings around both sides of the panty and press firmly"
        },
        {
          step: 3,
          title: "Dispose Properly",
          description: "Place used pads in a designated waste bin or disposal system"
        },
        {
          step: 4,
          title: "Environmental Impact",
          description: "Proper disposal helps waste collectors identify and segregate sanitary waste for recycling"
        }
      ]
    },
    {
      id: 4,
      title: "When to Change a Sanitary Napkin",
      icon: <Clock size={24} />,
      color: "card-rose",
      content: "A sanitary pad is meant to absorb blood, vaginal mucus and other materials that your body discards during periods. This may give you an idea of how hygienic or unhygienic it could be if you aren't able to change your pad for long. Yes, you are on the right track. If you think a sanitary pad needs to be changed frequently, however, how often to change pads during your periods cannot have a standard answer. This is applicable to every woman.",
      changingGuide: [
        {
          title: "Individual Variation",
          description: "Like most things, it is actually depends on a number of factors. Just so you know, it may seem like you bleed a lot during your period, but most girls normally lose between 4 and 12 teaspoons of blood during a typical menstrual cycle, which really isn't a lot."
        },
        {
          title: "Flow Differences",
          description: "However, you normally have medium to low flow or are not bleeding much during a particular menstrual cycle, it does not mean that you can skip changing your pad for the entire day! You need to know how often you should change a sanitary pad and stick to a fairly stable routine."
        },
        {
          title: "Absorbency Matters",
          description: "If you are using a pad with higher absorption capacity that is made for long usage, such a pad can be used slightly longer. As mentioned before, there is no fixed answer that will be true for every woman."
        },
        {
          title: "Track Your Flow",
          description: "Keep track of your flow for the initial few months and that could help you understand when to change a pad and what works best for you. One tip from Stayfree that will help you is to change your pad every 4 hours or as needed for comfort!"
        }
      ]
    },
    {
      id: 5,
      title: "Choosing the Right Pad",
      icon: <Lightbulb size={24} />,
      color: "card-amber",
      content: "Choosing the right sanitary pad is essential for comfort and protection during your period. Different pads are designed for different flow levels and situations.",
      padTypes: [
        {
          name: "Regular Pads",
          description: "Best for light to moderate flow. Suitable for most days of your period."
        },
        {
          name: "Heavy Flow Pads",
          description: "Designed for heavier bleeding days. Thicker and more absorbent than regular pads."
        },
        {
          name: "Overnight Pads",
          description: "Extra long and absorbent pads designed for nighttime use and longer protection."
        },
        {
          name: "Panty Liners",
          description: "Very thin pads for light spotting or as backup protection with tampons."
        },
        {
          name: "Winged Pads",
          description: "Have wings that wrap around the sides of your panties for extra protection and security."
        },
        {
          name: "Wingless Pads",
          description: "Simpler design without wings, suitable for those who prefer a more minimal feel."
        }
      ]
    },
    {
      id: 6,
      title: "Tips for Pad Comfort",
      icon: <Droplet size={24} />,
      color: "card-violet",
      content: "Making your period experience more comfortable involves choosing the right pad and following good hygiene practices.",
      tips: [
        {
          title: "Change Regularly",
          description: "Change your pad every 4-6 hours or when needed to maintain hygiene and comfort"
        },
        {
          title: "Choose Right Size",
          description: "Select the appropriate size and thickness based on your flow level"
        },
        {
          title: "Keep Clean",
          description: "Wash your hands before and after changing your pad"
        },
        {
          title: "Wear Breathable Underwear",
          description: "Choose cotton underwear to allow better air circulation"
        },
        {
          title: "Stay Hydrated",
          description: "Drink plenty of water to stay comfortable during your period"
        },
        {
          title: "Track Your Flow",
          description: "Keep track of your flow to understand your pattern and choose appropriate pads"
        },
        {
          title: "Dispose Properly",
          description: "Always dispose of used pads in designated waste bins"
        },
        {
          title: "Consider Backup",
          description: "Use panty liners as backup protection on heavier days if needed"
        }
      ]
    }
  ];

  const toggleCard = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <div className="card-page-container card3-container">
      {/* Header */}
      <div className="card-header">
        <div className="header-content">
          <h1 className="header-title">Understanding Sanitary Napkins</h1>
          <p className="header-subtitle">Learn how to use, choose, and dispose of sanitary pads properly</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="cards-grid">
        {cardData.map((card) => (
          <div
            key={card.id}
            className={`info-card ${card.color} ${expandedCard === card.id ? 'expanded' : ''}`}
            onClick={() => toggleCard(card.id)}
          >
            {/* Card Header */}
            <div className="card-header-content">
              <div className="card-icon-wrapper">
                {card.icon}
              </div>
              <div className="card-title-section">
                <h2 className="card-title">{card.title}</h2>
                <div className="expand-indicator">
                  {expandedCard === card.id ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
              </div>
            </div>

            {/* Card Content */}
            {expandedCard === card.id && (
              <div className="card-content">
                <p className="card-description">{card.content}</p>

                {/* Key Points */}
                {card.keyPoints && (
                  <div className="key-points">
                    <h3 className="key-points-title">Key Points:</h3>
                    <ul className="points-list">
                      {card.keyPoints.map((point, idx) => (
                        <li key={idx} className="point-item">
                          <span className="point-bullet">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Steps */}
                {card.steps && (
                  <div className="steps-container">
                    <h3 className="steps-title">Steps to Use:</h3>
                    <div className="steps-list">
                      {card.steps.map((item, idx) => (
                        <div key={idx} className="step-item">
                          <div className="step-header">
                            <span className="step-number">{item.step}</span>
                            <h4 className="step-title">{item.title}</h4>
                          </div>
                          <p className="step-description">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disposal Steps */}
                {card.disposalSteps && (
                  <div className="disposal-container">
                    <h3 className="disposal-title">Disposal Steps:</h3>
                    <div className="disposal-list">
                      {card.disposalSteps.map((item, idx) => (
                        <div key={idx} className="disposal-item">
                          <div className="disposal-header">
                            <span className="disposal-number">{item.step}</span>
                            <h4 className="disposal-title-text">{item.title}</h4>
                          </div>
                          <p className="disposal-description">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Changing Guide */}
                {card.changingGuide && (
                  <div className="guide-container">
                    <h3 className="guide-title">When to Change - Guide:</h3>
                    <div className="guide-list">
                      {card.changingGuide.map((item, idx) => (
                        <div key={idx} className="guide-item">
                          <h4 className="guide-item-title">{item.title}</h4>
                          <p className="guide-item-description">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pad Types */}
                {card.padTypes && (
                  <div className="pad-types-container">
                    <h3 className="pad-types-title">Types of Pads:</h3>
                    <div className="pad-types-list">
                      {card.padTypes.map((type, idx) => (
                        <div key={idx} className="pad-type-item">
                          <h4 className="pad-type-name">{type.name}</h4>
                          <p className="pad-type-description">{type.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tips */}
                {card.tips && (
                  <div className="tips-container">
                    <h3 className="tips-title">Comfort Tips:</h3>
                    <div className="tips-grid">
                      {card.tips.map((tip, idx) => (
                        <div key={idx} className="tip-card">
                          <div className="tip-header">
                            <span className="tip-number">{idx + 1}</span>
                            <h4 className="tip-title">{tip.title}</h4>
                          </div>
                          <p className="tip-description">{tip.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="card-footer">
        <div className="footer-content">
          <h3 className="footer-title">💡 Remember</h3>
          <p className="footer-text">
            Every person's period is unique. What works best for you may be different from others. 
            Experiment with different pad types and brands to find what makes you most comfortable. 
            Don't hesitate to ask your doctor or pharmacist for recommendations if you need help choosing the right product.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Card3;
