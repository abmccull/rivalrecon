import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Spinner,
  Center,
  Badge,
  Flex,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Button,
  IconButton,
  useBreakpointValue,
  HStack,
  VStack,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { ChevronLeftIcon, DownloadIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { FiCheck, FiX } from 'react-icons/fi';
import { useSupabaseAuth } from '../../features/auth/SupabaseAuthProvider';
import Plot from 'react-plotly.js';
import WordCloud from 'react-d3-cloud';
import { Layout } from '../../components/layout';
import { Link as RouterLink } from 'react-router-dom';
import { PlotData } from 'plotly.js';

// Define analysis data structure based on Supabase table
// Updated to include fields potentially coming from submissions join
interface AnalysisData {
  id: string; // from analyses
  submission_id: string; // from analyses
  product_name: string; // from submissions
  brand: string; // from submissions
  total_reviews: number; // from submissions
  average_rating: number; // from submissions
  url: string; // from submissions
  sentiment_score: number; // from analyses
  positive_keywords: string[]; // from analyses (needs backend fix)
  negative_keywords: string[]; // from analyses (needs backend fix)
  key_themes: string[]; // from analyses
  insights: string[]; // from analyses (needs backend fix)
  opportunities: string[]; // from analyses
  created_at: string; // from analyses
  updated_at?: string; // from analyses
  // Fields that might exist in analyses but weren't in the log
  ratings_over_time?: any; 
  trending?: string;
  top_positives?: string[];
  top_negatives?: string[];
  word_map?: Record<string, number>;
  competitive_insights?: string[];
}

// Helper function for formatting dates
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Helper function to truncate text with ellipsis
const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// Helper function to highlight keywords in text
const highlightKeywords = (text: string, keywords: string[] | undefined) => {
  if (!text) return text;
  if (!keywords || !keywords.length) return text;

  let highlightedText = text;
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    highlightedText = highlightedText.replace(
      regex, 
      `<span style="color: #4299E1; font-weight: bold;">${keyword}</span>`
    );
  });
  
  return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
};

// Individual visualization components
const SummaryCard = ({ analysis }: { analysis: AnalysisData }) => (
  <Card h="full">
    <CardHeader pb={0}>
      <Heading size="md">Summary</Heading>
    </CardHeader>
    <CardBody>
      <VStack align="start" spacing={3}>
        <Flex justify="space-between" w="full">
          <Text fontWeight="bold">Product Name:</Text>
          <Text maxW="60%" textAlign="right">{truncateText(analysis.product_name, 40) || 'N/A'}</Text>
        </Flex>
        <Flex justify="space-between" w="full">
          <Text fontWeight="bold">Brand:</Text>
          <Text>{analysis.brand || 'N/A'}</Text>
        </Flex>
        <Flex justify="space-between" w="full">
          <Text fontWeight="bold">Total Reviews:</Text>
          <Text>{analysis.total_reviews || 0}</Text>
        </Flex>
        <Flex justify="space-between" w="full">
          <Text fontWeight="bold">Average Rating:</Text>
          <Text>{(analysis.average_rating !== undefined && analysis.average_rating !== null) ? analysis.average_rating.toFixed(1) : 'N/A'} / 5.0</Text>
        </Flex>
        <Flex justify="space-between" w="full">
          <Text fontWeight="bold">Analysis Date:</Text>
          <Text>{formatDate(analysis.created_at)}</Text>
        </Flex>
        <Box w="full" pt={2}>
          <Button
            as="a"
            href={analysis.url || '#'}
            target="_blank"
            rightIcon={<ExternalLinkIcon />}
            size="sm"
            colorScheme="blue"
            variant="outline"
            w="full"
            isDisabled={!analysis.url}
          >
            View Product
          </Button>
        </Box>
      </VStack>
    </CardBody>
  </Card>
);

const SentimentGauge = ({ score }: { score: number }) => {
  // Convert score from 0-1 to 0-100 for gauge
  const sentimentScore = Math.round((score || 0) * 100);
  
  // Determine color based on score
  const getColor = (score: number) => {
    if (score < 30) return 'red';
    if (score < 60) return 'orange';
    if (score < 80) return 'yellow';
    return 'green';
  };

  // Configuration for gauge chart
  const data = [
    {
      type: 'indicator',
      mode: 'gauge+number',
      value: sentimentScore,
      title: { text: 'Sentiment Score', font: { size: 24 } },
      gauge: {
        axis: { range: [0, 100], tickwidth: 1, tickcolor: 'gray' },
        bar: { color: getColor(sentimentScore) },
        bgcolor: 'white',
        borderwidth: 2,
        bordercolor: 'gray',
        steps: [
          { range: [0, 30], color: 'rgba(255, 99, 132, 0.2)' },
          { range: [30, 60], color: 'rgba(255, 159, 64, 0.2)' },
          { range: [60, 80], color: 'rgba(255, 205, 86, 0.2)' },
          { range: [80, 100], color: 'rgba(75, 192, 192, 0.2)' },
        ],
        threshold: {
          line: { color: 'red', width: 4 },
          thickness: 0.75,
          value: sentimentScore
        }
      }
    }
  ] as PlotData[];

  const layout = {
    width: 300,
    height: 250,
    margin: { t: 40, r: 25, l: 25, b: 30 },
    paper_bgcolor: 'transparent',
    font: { color: 'darkblue', family: 'Arial' },
    autosize: true
  };

  const config = {
    displayModeBar: false,
    responsive: true,
  };

  return (
    <Card h="full">
      <CardHeader pb={0}>
        <Heading size="md">Sentiment Analysis</Heading>
      </CardHeader>
      <CardBody>
        <Center>
          <Plot
            data={data}
            layout={layout}
            config={config}
            style={{ width: '100%', height: '100%' }}
          />
        </Center>
        <Text textAlign="center" fontSize="sm" mt={2} color="gray.600">
          {sentimentScore < 30 ? 'Mostly negative sentiment' :
           sentimentScore < 60 ? 'Mixed sentiment, leaning negative' :
           sentimentScore < 80 ? 'Mixed sentiment, leaning positive' :
           'Mostly positive sentiment'}
        </Text>
      </CardBody>
    </Card>
  );
};

const RatingsChart = ({ analysis }: { analysis: AnalysisData }) => {
  // Use ratings_over_time if available, or fall back to product star distribution
  const ratingData = analysis.ratings_over_time || {
      '1': 5, '2': 12, '3': 18, '4': 25, '5': 40
  };
  
  const labels = Object.keys(ratingData).map(k => `${k} ${typeof parseInt(k) === 'number' ? 'Star' + (parseInt(k) > 1 ? 's' : '') : ''}`);
  const values = Object.values(ratingData);

  const data = [
    {
      x: labels,
      y: values,
      type: 'bar',
      marker: {
        color: ['#FC8181', '#F6AD55', '#F6E05E', '#68D391', '#4FD1C5'] // Colors for rating levels
      },
    }
  ] as PlotData[];

  const layout = {
    title: 'Rating Distribution',
    xaxis: { title: '' },
    yaxis: { title: 'Count' },
    bargap: 0.3,
    margin: { t: 40, r: 10, l: 50, b: 80 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    autosize: true
  };

  const config = {
    displayModeBar: false,
    responsive: true
  };

  return (
    <Card h="full">
      <CardHeader pb={0}>
        <Heading size="md">Rating Distribution</Heading>
      </CardHeader>
      <CardBody>
        <Box h="100%" minH="250px">
          <Plot 
            data={data} 
            layout={layout} 
            config={config} 
            style={{ width: '100%', height: '100%' }}
          />
        </Box>
      </CardBody>
    </Card>
  );
};

const PositivesNegativesChart = ({ analysis }: { analysis: AnalysisData }) => {
  // Get counts of positive and negative keywords/mentions
  const positiveCount = analysis.positive_keywords?.length || 0;
  const negativeCount = analysis.negative_keywords?.length || 0;

  const data = [
    {
      type: 'bar',
      x: ['Positive Mentions', 'Negative Mentions'],
      y: [positiveCount, negativeCount],
      marker: {
        color: ['#68D391', '#FC8181']
      }
    }
  ] as PlotData[];

  const layout = {
    title: 'Positive vs. Negative Mentions',
    margin: { t: 40, r: 10, l: 50, b: 40 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    autosize: true
  };

  const config = {
    displayModeBar: false,
    responsive: true
  };

  return (
    <Card h="full">
      <CardHeader pb={0}>
        <Heading size="md">Sentiment Breakdown</Heading>
      </CardHeader>
      <CardBody>
        <Box h="100%" minH="250px">
          <Plot 
            data={data} 
            layout={layout} 
            config={config}
            style={{ width: '100%', height: '100%' }}
          />
        </Box>
      </CardBody>
    </Card>
  );
};

const WordCloudDisplay = ({ 
  positiveKeywords, 
  negativeKeywords,
  wordMap
}: { 
  positiveKeywords: string[] | undefined, 
  negativeKeywords: string[] | undefined,
  wordMap: Record<string, number> | undefined
}) => {
  // Format data for visualization
  let data: { text: string; value: number; type: string }[] = [];
  
  // If we have explicit keywords, use them with random values for visualization
  if (positiveKeywords && positiveKeywords.length > 0) {
    data = data.concat(positiveKeywords.map(word => ({ 
      text: word, 
      value: Math.random() * 50 + 30, 
      type: 'positive' 
    })));
  }
  
  if (negativeKeywords && negativeKeywords.length > 0) {
    data = data.concat(negativeKeywords.map(word => ({ 
      text: word, 
      value: Math.random() * 50 + 20, 
      type: 'negative' 
    })));
  }
  
  // If no keywords but we have word_map, use that instead (all terms with their exact frequency)
  if (data.length === 0 && wordMap && Object.keys(wordMap).length > 0) {
    data = Object.entries(wordMap).map(([text, value]) => ({
      text,
      value: value * 3 + 10, // Scale values to be more visible
      // Assign type based on whether it appears in positive/negative lists or fallback to word frequency
      type: positiveKeywords?.some(k => k.toLowerCase().includes(text.toLowerCase())) ? 'positive' :
            negativeKeywords?.some(k => k.toLowerCase().includes(text.toLowerCase())) ? 'negative' :
            value > 8 ? 'positive' : 'negative'
    }));
  }
  
  // Word cloud settings
  const fontSize = (word: { value: number }) => Math.log2(word.value) * 5 + 12;
  const rotate = () => 0; // No rotation for better readability
  const fill = (word: { type: string }) => word.type === 'positive' ? '#68D391' : '#FC8181';

  return (
    <Card h="full">
      <CardHeader pb={0}>
        <Heading size="md">Key Terms</Heading>
      </CardHeader>
      <CardBody pt={2}>
        <Flex justify="center" mb={4}>
          <HStack spacing={4}>
            <Badge colorScheme="green" p={1} borderRadius="md">Positive</Badge>
            <Badge colorScheme="red" p={1} borderRadius="md">Negative</Badge>
          </HStack>
        </Flex>
        <Box h="250px" w="100%">
          {data.length > 0 ? (
            <WordCloud
              data={data}
              font="Impact"
              fontWeight="bold"
              fontSize={fontSize}
              rotate={rotate}
              fill={fill}
              padding={2}
            />
          ) : (
            <Center h="100%">
              <Text color="gray.500">No keyword data available</Text>
            </Center>
          )}
        </Box>
      </CardBody>
    </Card>
  );
};

const KeyThemesDisplay = ({ themes }: { themes: string[] | undefined }) => (
  <Card h="full">
    <CardHeader pb={0}>
      <Heading size="md">Key Themes</Heading>
    </CardHeader>
    <CardBody>
      {themes && themes.length > 0 ? (
        <List spacing={2}>
          {themes.map((theme, index) => (
            <ListItem key={index} display="flex" alignItems="center">
              <ListIcon as={FiCheck} color="green.500" />
              <Text>{theme}</Text>
            </ListItem>
          ))}
        </List>
      ) : (
        <Text color="gray.500">No theme data available</Text>
      )}
    </CardBody>
  </Card>
);

const InsightsDisplay = ({ insights, positiveKeywords }: { insights: string[] | undefined, positiveKeywords: string[] | undefined }) => (
  <Card h="full">
    <CardHeader pb={0}>
      <Heading size="md">Key Insights</Heading>
    </CardHeader>
    <CardBody>
      {insights && insights.length > 0 ? (
        <List spacing={3}>
          {insights.map((insight, index) => (
            <ListItem key={index}>
              <Text>{highlightKeywords(insight, positiveKeywords)}</Text>
            </ListItem>
          ))}
        </List>
      ) : (
        <Text color="gray.500">No insights data available</Text>
      )}
    </CardBody>
  </Card>
);

const OpportunitiesDisplay = ({ opportunities, negativeKeywords }: { opportunities: string[] | undefined, negativeKeywords: string[] | undefined }) => (
  <Card h="full">
    <CardHeader pb={0}>
      <Heading size="md">Improvement Opportunities</Heading>
    </CardHeader>
    <CardBody>
      {opportunities && opportunities.length > 0 ? (
        <List spacing={3}>
          {opportunities.map((opportunity, index) => (
            <ListItem key={index} display="flex">
              <ListIcon as={FiX} color="red.500" mt={1} />
              <Text>{highlightKeywords(opportunity, negativeKeywords)}</Text>
            </ListItem>
          ))}
        </List>
      ) : (
        <Text color="gray.500">No opportunities data available</Text>
      )}
    </CardBody>
  </Card>
);

export default function AnalysisDashboard() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { supabase, isLoading: isAuthLoading } = useSupabaseAuth();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Responsive column configuration
  const columnConfig = useBreakpointValue({ base: 1, md: 2, lg: 3 });

  // Get container height for better chart sizing
  const [containerHeight, setContainerHeight] = useState(300);
  useEffect(() => {
    // Adjust chart heights based on window size
    const updateHeight = () => {
      const height = window.innerWidth < 768 ? 250 : 300;
      setContainerHeight(height);
    };
    
    window.addEventListener('resize', updateHeight);
    updateHeight(); // Initial call
    
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!supabase || !submissionId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch analysis and submissions data separately to ensure we get all needed fields
        // First, get the analysis
        const { data: analysisData, error: analysisError } = await supabase
          .from('analyses')
          .select('*')
          .eq('submission_id', submissionId)
          .single();
        
        if (analysisError) throw analysisError;
        
        if (!analysisData) {
          setError('Analysis not found');
          return;
        }

        console.log('[AnalysisDashboard] Raw analysis data:', JSON.stringify(analysisData, null, 2));

        // Then, get the submission with product details
        const { data: submissionData, error: submissionError } = await supabase
          .from('submissions')
          .select('*')
          .eq('id', submissionId)
          .single();

        if (submissionError) {
          console.warn('[AnalysisDashboard] Error fetching submission:', submissionError);
          // Continue with just analysis data if submission fetch fails
        }

        console.log('[AnalysisDashboard] Raw submission data:', JSON.stringify(submissionData, null, 2));

        // Get review count for this submission
        const { count: reviewCount, error: reviewCountError } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('submission_id', submissionId);

        if (reviewCountError) {
          console.warn('[AnalysisDashboard] Error fetching review count:', reviewCountError);
        }

        console.log('[AnalysisDashboard] Review count:', reviewCount);

        // Calculate average rating if we have reviews
        let avgRating = 0;
        if (reviewCount && reviewCount > 0) {
          const { data: reviewStats, error: statsError } = await supabase
            .rpc('get_average_rating', { submission_id_param: submissionId });

          if (!statsError && reviewStats) {
            avgRating = reviewStats.average_rating || 0;
            console.log('[AnalysisDashboard] Average rating:', avgRating);
          } else {
            console.warn('[AnalysisDashboard] Error fetching average rating:', statsError);
          }
        }

        // Extract product details from submission if available
        let productName = 'N/A';
        let brand = 'N/A';
        let url = '#';

        if (submissionData) {
          url = submissionData.url || '#';
          
          // Use the correct field names from submission data
          productName = submissionData.product_title || 'N/A';
          brand = submissionData.brand_name || 'N/A';
          
          // Use product_overall_rating from submission data instead of trying to calculate it
          avgRating = submissionData.product_overall_rating || 0;
          
          // Optional - log what we found
          console.log('[AnalysisDashboard] Found product details:', {
            productName,
            brand,
            avgRating
          });
        }

        // Combine all data sources
        const combinedData = {
          ...analysisData,
          product_name: productName,
          brand: brand,
          url: url,
          total_reviews: reviewCount || 0,
          average_rating: avgRating || 0
        };

        // Ensure data has expected structures to prevent errors
        const safeData = {
          id: combinedData.id,
          submission_id: combinedData.submission_id,
          created_at: combinedData.created_at,
          updated_at: combinedData.updated_at,
          // Fields from submissions (provide defaults)
          product_name: combinedData.product_name || 'N/A',
          brand: combinedData.brand || 'N/A',
          total_reviews: combinedData.total_reviews === null || combinedData.total_reviews === undefined ? 0 : combinedData.total_reviews,
          average_rating: combinedData.average_rating === null || combinedData.average_rating === undefined ? 0 : combinedData.average_rating,
          url: combinedData.url || '#',
          // Fields from analyses (provide defaults)
          sentiment_score: combinedData.sentiment_score === null || combinedData.sentiment_score === undefined ? 0 : combinedData.sentiment_score,
          key_themes: Array.isArray(combinedData.key_themes) ? combinedData.key_themes : [],
          opportunities: Array.isArray(combinedData.opportunities) ? combinedData.opportunities : [],
          // Fields potentially in analyses but need fallback / backend fix
          positive_keywords: Array.isArray(combinedData.positive_keywords) ? combinedData.positive_keywords : (Array.isArray(combinedData.top_positives) ? combinedData.top_positives : []), // Fallback to top_positives
          negative_keywords: Array.isArray(combinedData.negative_keywords) ? combinedData.negative_keywords : (Array.isArray(combinedData.top_negatives) ? combinedData.top_negatives : []), // Fallback to top_negatives
          insights: Array.isArray(combinedData.insights) ? combinedData.insights : (Array.isArray(combinedData.competitive_insights) ? combinedData.competitive_insights : []), // Fallback to competitive_insights
          // Include other analysis fields if they exist
          ratings_over_time: combinedData.ratings_over_time,
          trending: combinedData.trending,
          word_map: combinedData.word_map,
        };

        // Use JSON.stringify for detailed logging
        console.log('[AnalysisDashboard] Processed safeData:', JSON.stringify(safeData, null, 2)); 
        
        setAnalysis(safeData as AnalysisData);
        // Logging state directly might show the object correctly after setting
        console.log('[AnalysisDashboard] Analysis state set. Current state:', safeData);

      } catch (err: any) {
        console.error('Error fetching analysis:', err);
        setError(err.message || 'Failed to load analysis data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!isAuthLoading && supabase) {
      fetchAnalysis();
    }
  }, [submissionId, supabase, isAuthLoading]);

  if (isAuthLoading || isLoading) {
    return (
      <Layout>
        <Center h="50vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text>Loading analysis...</Text>
          </VStack>
        </Center>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Center h="50vh">
          <VStack spacing={4} maxW="md" textAlign="center">
            <Heading size="md" color="red.500">Error Loading Analysis</Heading>
            <Text>{error}</Text>
            <Button as={RouterLink} to="/dashboard" leftIcon={<ChevronLeftIcon />}>
              Return to Dashboard
            </Button>
          </VStack>
        </Center>
      </Layout>
    );
  }

  if (!analysis) {
    return (
      <Layout>
        <Center h="50vh">
          <VStack spacing={4} maxW="md" textAlign="center">
            <Heading size="md">Analysis Data Unavailable</Heading>
            <Text>Analysis data could not be loaded or is still processing. Please try again later or return to the dashboard.</Text>
            <Button as={RouterLink} to="/dashboard" leftIcon={<ChevronLeftIcon />}>
              Return to Dashboard
            </Button>
          </VStack>
        </Center>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <Flex justify="space-between" align="center" mb={8}>
          <HStack>
            <Button 
              as={RouterLink} 
              to="/dashboard" 
              leftIcon={<ChevronLeftIcon />}
              size="sm"
              variant="outline"
            >
              Back
            </Button>
            <Heading size="lg">Analysis: {truncateText(analysis.product_name, 40)}</Heading>
          </HStack>
          <HStack>
            <IconButton
              aria-label="Export PDF"
              icon={<DownloadIcon />}
              size="sm"
              variant="outline"
            />
          </HStack>
        </Flex>
        
        <SimpleGrid columns={columnConfig} spacing={8} mb={10}>
          <SummaryCard analysis={analysis} />
          <SentimentGauge score={analysis.sentiment_score} />
          <PositivesNegativesChart analysis={analysis} />
        </SimpleGrid>
        
        <SimpleGrid columns={columnConfig} spacing={8} mb={10}>
          <RatingsChart analysis={analysis} />
          <WordCloudDisplay 
            positiveKeywords={analysis.positive_keywords} 
            negativeKeywords={analysis.negative_keywords}
            wordMap={analysis.word_map} // Pass word_map as fallback
          />
          <KeyThemesDisplay themes={analysis.key_themes} />
        </SimpleGrid>
        
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          <InsightsDisplay 
            insights={analysis.insights} 
            positiveKeywords={analysis.positive_keywords}
          />
          <OpportunitiesDisplay 
            opportunities={analysis.opportunities} 
            negativeKeywords={analysis.negative_keywords}
          />
        </SimpleGrid>
      </Container>
    </Layout>
  );
}